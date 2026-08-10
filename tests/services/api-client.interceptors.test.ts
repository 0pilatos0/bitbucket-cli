/**
 * Direct interceptor coverage for createApiClient (issue #265).
 *
 * Sibling to api-client.test.ts: that file covers the happy paths and the
 * broad retry/redaction matrix; this one pins the seams the behavioral tests
 * cannot see — replay headers, the auth-method re-check on 401, exact
 * APIError shape, the UNKNOWN branch, request-interceptor passthrough, and
 * DEBUG gating on the request/error paths.
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { createApiClient } from '../../src/services/api-client.service.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockAdapter,
  createMockConfigService,
  createMockOAuthService,
  createMockOutputService,
  mockConfigService,
  mockOAuthConfigService,
} from '../setup.js';
import type { AxiosInstance } from 'axios';

const originalSetTimeout = globalThis.setTimeout;

/** Install the synchronous setTimeout stub that neutralizes sleep(). */
function stubSetTimeout(): void {
  globalThis.setTimeout = ((fn: Function, _ms?: number) => {
    fn();
    return 0 as never;
  }) as never;
}

describe('createApiClient - 401 refresh replay', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

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

    const adapter = (config: { headers: { Authorization?: string } }) => {
      authHeaders.push(config.headers.Authorization);
      if (authHeaders.length === 1) {
        const error = new Error('Request failed with status code 401');
        (error as any).response = {
          data: { error: { message: 'Unauthorized' } },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        };
        (error as any).config = config;
        (error as any).isAxiosError = true;
        return Promise.reject(error);
      }
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };

    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthService
    );
    client.defaults.adapter = adapter as never;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(authHeaders).toEqual([
      'Bearer expired-token',
      'Bearer brand-new-token',
    ]);
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
      store as never,
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as never;

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
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

  it('retries a 504 and succeeds', async () => {
    const mockAdapter = createMockAdapter([
      { status: 504, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as never;

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
    client.defaults.adapter = mockAdapter.adapter as never;

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
      client.defaults.adapter = mockAdapter.adapter as never;

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
    client.defaults.adapter = mockAdapter.adapter as never;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    // HTTP-date is not parsed; the exponential 1000ms (attempt 1) applies.
    expect(setTimeoutCalls).toEqual([1000]);
  });
});

describe('createApiClient - APIError shape', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

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
      client.defaults.adapter = mockAdapter.adapter as never;

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
    client.defaults.adapter = mockAdapter.adapter as never;

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
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

  it('maps request-interceptor rejections to UNKNOWN with the original as cause', async () => {
    const originalError = new Error('store exploded');
    const store = {
      ...mockConfigService(),
      getAuthMethod: async () => {
        throw originalError;
      },
    };
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    const client = createApiClient(store as never, createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as never;

    // The request interceptor's rejection lands in the response interceptor's
    // rejected handler, which maps it (no response/request) to UNKNOWN.
    const rejection = client.get('/test').catch((e: unknown) => e);
    const error = await rejection;
    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.UNKNOWN);
    expect((error as BBError).message).toBe('store exploded');
    expect((error as BBError).cause).toBe(originalError);
    expect(mockAdapter.getCallCount()).toBe(0);
  });

  it('maps getCredentials failures for basic auth to UNKNOWN with cause', async () => {
    const store = createMockConfigService({}); // no credentials configured
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    const client = createApiClient(store as never, createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as never;

    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.UNKNOWN);
    expect((error as BBError).message).toBe('Auth required');
    expect((error as BBError).cause).toMatchObject({ code: 1001 });
    expect(mockAdapter.getCallCount()).toBe(0);
  });
});

describe('createApiClient - DEBUG request/error gating', () => {
  let consoleDebugSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    stubSetTimeout();
    originalDebug = process.env.DEBUG;
    consoleDebugSpy = spyOn(console, 'debug').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleDebugSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    if (originalDebug === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalDebug;
    }
  });

  it('logs nothing on the request or error path when DEBUG is unset', async () => {
    delete process.env.DEBUG;
    const mockAdapter = createMockAdapter([
      { status: 500, data: { error: { message: 'boom' } } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as never;

    try {
      await client.get('/test');
    } catch {
      // expected — we only care about the debug log absence
    }

    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('logs the error line and redacts the error body when DEBUG is set', async () => {
    process.env.DEBUG = 'true';
    const mockAdapter = createMockAdapter([
      {
        status: 500,
        data: { error: { message: 'boom' }, access_token: 'top-secret' },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as never;

    try {
      await client.get('/test');
    } catch {
      // expected
    }

    const output = consoleDebugSpy.mock.calls
      .map((args) => args.map((a) => String(a)).join(' '))
      .join('\n');
    expect(output).toContain('[HTTP] Error:');
    expect(output).toContain('[HTTP] Error Response Body:');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('top-secret');
  });
});
