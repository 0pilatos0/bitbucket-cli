/**
 * Direct interceptor coverage for createApiClient (issue #265).
 *
 * Sibling to api-client.test.ts: that file covers the happy paths and the
 * broad retry/timeout/network matrix; this one pins the seams the behavioral
 * tests cannot see — replay headers, the auth-method re-check on 401, exact
 * APIError shape, the UNKNOWN branch, request-interceptor passthrough, and
 * DEBUG gating on the request/error paths. It also owns the DEBUG logging
 * matrix (moved here from api-client.test.ts so redaction coverage has a
 * single owner).
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { createApiClient } from '../../src/services/api-client.service.js';
import {
  MAX_ADAPTIVE_INTERVAL_MS,
  RateLimiter,
} from '../../src/services/rate-limiter.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockAdapter,
  createMockConfigService,
  createMockOAuthService,
  createMockOutputService,
  mockConfigService,
  mockOAuthConfigService,
  restoreSetTimeout,
  stubSetTimeout,
} from '../setup.js';
import type { AxiosInstance } from 'axios';

beforeEach(() => {
  stubSetTimeout();
});

afterEach(() => {
  restoreSetTimeout();
});

describe('createApiClient - 401 refresh replay', () => {
  it('re-sends the replayed request with the refreshed Bearer token', async () => {
    const authHeaders: Array<string | undefined> = [];
    // Stateful mock: the store rotates to the new token on refresh, which is
    // what the request interceptor picks up when the 401 replay re-runs it.
    let currentToken = 'expired-token';
    const oauthService = {
      async getValidAccessToken() {
        return currentToken;
      },
      async refreshAccessToken() {
        currentToken = 'brand-new-token';
        return currentToken;
      },
      async authorize() {
        return { username: 'u', displayName: 'U', accountId: '1' };
      },
      async revokeToken() {},
    } as never;

    const mockAdapter = createMockAdapter(
      [
        { status: 401, data: { error: { message: 'Unauthorized' } } },
        { status: 200, data: { ok: true } },
      ],
      {
        onRequest: (config) => {
          authHeaders.push(config.headers.Authorization);
        },
      }
    );

    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthService
    );
    client.defaults.adapter = mockAdapter.adapter;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(authHeaders).toEqual([
      'Bearer expired-token',
      'Bearer brand-new-token',
    ]);
  });

  it('keeps the retry budget across a 401 refresh replay (401 -> 429 -> 200)', async () => {
    const oauthMock = createMockOAuthService({
      validToken: 'expired-token',
      refreshedToken: 'new-token',
    });
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
      { status: 429, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter;

    const response = await client.get('/test');

    // The 429 after the replay must retry once — the shared __retryCount on
    // the same config never saw an increment, and no second refresh happens.
    expect(response.status).toBe(200);
    expect(mockAdapter.getCallCount()).toBe(3);
    expect(oauthMock.getRefreshCallCount()).toBe(1);
  });

  it('skips the 401 refresh when the auth-method re-check no longer sees oauth', async () => {
    const store = mockOAuthConfigService();
    let authMethodCalls = 0;
    const originalGetAuthMethod = store.getAuthMethod.bind(store);
    store.getAuthMethod = async () => {
      authMethodCalls++;
      // First call (request interceptor) sees oauth; the 401 re-check flips
      // to basic, which must suppress the reactive refresh.
      return authMethodCalls >= 2 ? 'basic' : originalGetAuthMethod();
    };

    const oauthMock = createMockOAuthService();
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
    ]);
    const client = createApiClient(
      store,
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      expect((err as APIError).code).toBe(ErrorCode.AUTH_INVALID);
    }

    expect(oauthMock.getRefreshCallCount()).toBe(0);
    expect(authMethodCalls).toBe(2);
  });
});

describe('createApiClient - retry matrix completion', () => {
  it('retries a 504 and succeeds', async () => {
    const mockAdapter = createMockAdapter([
      { status: 504, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(mockAdapter.getCallCount()).toBe(2);
  });

  it('retries POST on 429 (status-code retries apply to all methods)', async () => {
    const mockAdapter = createMockAdapter([
      { status: 429, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter;

    const response = await client.post('/test', {});

    expect(response.status).toBe(200);
    expect(mockAdapter.getCallCount()).toBe(2);
  });

  it.each([502, 503, 504])(
    'exhausts retries for %s into API_SERVER_ERROR (4 calls)',
    async (status) => {
      const mockAdapter = createMockAdapter([
        { status, data: {} },
        { status, data: {} },
        { status, data: {} },
        { status, data: {} },
      ]);
      const client = createApiClient(
        mockConfigService(),
        createMockOutputService()
      );
      client.defaults.adapter = mockAdapter.adapter;

      try {
        await client.get('/test');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(APIError);
        expect((err as APIError).code).toBe(ErrorCode.API_SERVER_ERROR);
        expect((err as APIError).statusCode).toBe(status);
      }

      expect(mockAdapter.getCallCount()).toBe(4);
    }
  );

  it('falls back to exponential backoff when Retry-After is an HTTP-date', async () => {
    const setTimeoutCalls: number[] = [];
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as never;
    }) as never;

    const mockAdapter = createMockAdapter([
      {
        status: 429,
        data: {},
        headers: { 'retry-after': 'Tue, 15 Nov 1994 08:12:31 GMT' },
      },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    // HTTP-date is not parsed; the exponential 1000ms (attempt 1) applies.
    expect(setTimeoutCalls).toEqual([1000]);
  });
});

describe('createApiClient - APIError shape', () => {
  it.each([
    [403, ErrorCode.API_FORBIDDEN],
    [500, ErrorCode.API_SERVER_ERROR],
    [400, ErrorCode.API_REQUEST_FAILED],
  ])(
    'maps status %s to %s at the interceptor boundary',
    async (status, code) => {
      const mockAdapter = createMockAdapter([{ status, data: {} }]);
      const client = createApiClient(
        mockConfigService(),
        createMockOutputService()
      );
      client.defaults.adapter = mockAdapter.adapter;

      try {
        await client.get('/test');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(APIError);
        expect((err as APIError).code).toBe(code);
        expect((err as APIError).statusCode).toBe(status);
      }
    }
  );

  it('sets context {status, method, url} and preserves the raw response body', async () => {
    const body = { error: { message: 'Nope', fields: { title: ['missing'] } } };
    const mockAdapter = createMockAdapter([{ status: 400, data: body }]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter;

    try {
      await client.post('/repos/ws/r', {});
      expect(true).toBe(false);
    } catch (err) {
      const apiErr = err as APIError;
      expect(apiErr.context).toEqual({
        status: 400,
        method: 'POST',
        url: '/repos/ws/r',
      });
      expect(apiErr.response).toBe(body);
      expect(apiErr.message).toBe('Nope (title: missing)');
    }
  });

  it('maps errors with neither response nor request to UNKNOWN with cause', async () => {
    const adapter = () => {
      const error = new Error('mystery failure');
      (error as any).isAxiosError = true;
      return Promise.reject(error);
    };
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      expect((err as BBError).code).toBe(ErrorCode.UNKNOWN);
      expect((err as BBError).cause).toBeInstanceOf(Error);
    }
  });
});

describe('createApiClient - interceptor edges', () => {
  it('maps request-interceptor rejections to UNKNOWN with the original as cause', async () => {
    const originalError = new Error('store exploded');
    const store = {
      ...mockConfigService(),
      getAuthMethod: async () => {
        throw originalError;
      },
    };
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    const client = createApiClient(store, createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    // The request interceptor's rejection lands in the response interceptor's
    // rejected handler, which maps it (no response/request) to UNKNOWN.
    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.UNKNOWN);
    expect((error as BBError).message).toBe('store exploded');
    expect((error as BBError).cause).toBe(originalError);
    expect(mockAdapter.getCallCount()).toBe(0);
  });

  it('maps getCredentials failures for basic auth to UNKNOWN with cause', async () => {
    const store = createMockConfigService({}); // no credentials configured
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    const client = createApiClient(store, createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.UNKNOWN);
    expect((error as BBError).message).toBe('Auth required');
    expect((error as BBError).cause).toMatchObject({ code: 1001 });
    expect(mockAdapter.getCallCount()).toBe(0);
  });
});

describe('createApiClient - DEBUG logging and redaction', () => {
  let client: AxiosInstance;
  let consoleDebugSpy: ReturnType<typeof spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    originalDebug = process.env.DEBUG;
    consoleDebugSpy = spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    if (originalDebug === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalDebug;
    }
  });

  function allDebugOutput(): string {
    return consoleDebugSpy.mock.calls
      .map((args) => args.map((a) => String(a)).join(' '))
      .join('\n');
  }

  it('redacts access_token and refresh_token from response body logs', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([
      {
        status: 200,
        data: {
          access_token: 'secret-AT',
          refresh_token: 'secret-RT',
          expires_in: 7200,
          scopes: 'repository',
        },
      },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test');

    const output = allDebugOutput();
    expect(output).toContain('[HTTP] Response Body:');
    expect(output).not.toContain('secret-AT');
    expect(output).not.toContain('secret-RT');
    expect(output).toContain('[REDACTED]');
    // Non-sensitive fields still logged.
    expect(output).toContain('expires_in');
    expect(output).toContain('7200');
    expect(output).toContain('scopes');
  });

  it('redacts tokens from error response body logs', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: { error: 'invalid_grant', access_token: 'leaked' },
      },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    try {
      await client.get('/test');
    } catch {
      // expected
    }

    const output = allDebugOutput();
    expect(output).toContain('[HTTP] Error Response Body:');
    expect(output).not.toContain('leaked');
    expect(output).toContain('[REDACTED]');
    expect(output).toContain('invalid_grant');
  });

  it('redacts sensitive keys nested inside arrays and objects', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([
      {
        status: 200,
        data: {
          data: {
            items: [
              { id: 1, token: 'nested-secret' },
              { id: 2, password: 'also-secret' },
            ],
          },
        },
      },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test');

    const output = allDebugOutput();
    expect(output).not.toContain('nested-secret');
    expect(output).not.toContain('also-secret');
    expect(output).toContain('[REDACTED]');
    // Non-sensitive surrounding data survives.
    expect(output).toContain('items');
  });

  it('does not log response bodies when DEBUG is not set', async () => {
    delete process.env.DEBUG;
    const mockAdapter = createMockAdapter([
      {
        status: 200,
        data: { access_token: 'should-not-be-logged' },
      },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('logs nothing on the request or error path when DEBUG is unset', async () => {
    delete process.env.DEBUG;
    const mockAdapter = createMockAdapter([
      { status: 500, data: { error: { message: 'boom' } } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    try {
      await client.get('/test');
    } catch {
      // expected — we only care about the debug log absence
    }

    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('handles circular references without infinite recursion', async () => {
    process.env.DEBUG = 'true';
    const circular: Record<string, unknown> = { name: 'self' };
    circular.self = circular;
    const mockAdapter = createMockAdapter([{ status: 200, data: circular }]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test');

    const output = allDebugOutput();
    expect(output).toContain('[Circular]');
    expect(output).toContain('self');
  });

  it('handles circular references nested inside arrays', async () => {
    process.env.DEBUG = 'true';
    const inner: Record<string, unknown> = { token: 'secret' };
    const mockAdapter = createMockAdapter([
      { status: 200, data: [inner, inner] },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test');

    const output = allDebugOutput();
    expect(output).not.toContain('secret');
    expect(output).toContain('[Circular]');
  });

  it('logs request method and URL when DEBUG is set', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/some/resource');

    const output = allDebugOutput();
    expect(output).toContain('[HTTP] GET');
    expect(output).toContain('/some/resource');
  });

  it('redacts query strings from request URL DEBUG logs', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter;

    await client.get('/test?token=abc&other=xyz');

    const output = allDebugOutput();
    expect(output).toContain('[HTTP] GET');
    expect(output).toContain('/test');
    expect(output).not.toContain('token=abc');
    expect(output).not.toContain('other=xyz');
    expect(output).toContain('[redacted]');
  });
});

describe('createApiClient - rate limiter feedback', () => {
  it('feeds rejected 429 responses into the rate limiter', async () => {
    const limiter = new RateLimiter();
    expect(limiter.intervalMs).toBe(0);

    const mockAdapter = createMockAdapter([
      {
        status: 429,
        data: { error: { message: 'Slow down' } },
        headers: {
          'x-ratelimit-remaining': '2',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 30),
        },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService(),
      undefined,
      limiter
    );
    client.defaults.adapter = mockAdapter.adapter as never;

    await expect(client.get('/test')).rejects.toBeInstanceOf(APIError);

    // The rejected response's headers must still pace future requests:
    // (30_000 - 500) / 2 far exceeds the cap, so the interval saturates.
    expect(limiter.intervalMs).toBe(MAX_ADAPTIVE_INTERVAL_MS);
    // Initial attempt + MAX_RETRIES retries all went out.
    expect(mockAdapter.getCallCount()).toBe(4);
  });

  it('feeds successful responses into the rate limiter', async () => {
    const limiter = new RateLimiter();
    const mockAdapter = createMockAdapter([
      {
        status: 200,
        data: { ok: true },
        headers: {
          'x-ratelimit-remaining': '9',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 10),
        },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService(),
      undefined,
      limiter
    );
    client.defaults.adapter = mockAdapter.adapter as never;

    const response = await client.get('/test');
    expect(response.status).toBe(200);
    // (10_000 - 500) / 9 ≈ 1056ms of adaptive spacing now applies.
    expect(limiter.intervalMs).toBeGreaterThan(900);
    expect(limiter.intervalMs).toBeLessThanOrEqual(1056);
  });
});
