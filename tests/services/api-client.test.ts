/**
 * API Client Service tests - retry/backoff logic
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from 'bun:test';
import { createApiClient } from '../../src/services/api-client.service.js';
import { OAuthService } from '../../src/services/oauth.service.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockAdapter,
  createMockConfigService,
  createMockOAuthService,
  createMockOutputService,
  createNetworkErrorAdapter,
  createTimeoutErrorAdapter,
  createUrlKeyedAdapter,
  mockConfigService,
  mockOAuthConfigService,
  restoreSetTimeout,
  stubSetTimeout,
} from '../setup.js';
import type { AxiosInstance } from 'axios';

// Kept for the concurrency test that awaits a real timer.
const originalSetTimeout = globalThis.setTimeout;

describe('createApiClient - OAuth auth', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('should use Bearer token when auth method is oauth', async () => {
    const oauthMock = createMockOAuthService({ validToken: 'my-bearer-token' });
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
  });

  it('should use Basic auth when auth method is basic even with oauthService provided', async () => {
    const oauthMock = createMockOAuthService();
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(
      mockConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
  });

  it('should attempt token refresh on 401 for OAuth', async () => {
    const oauthMock = createMockOAuthService({
      validToken: 'expired-token',
      refreshedToken: 'new-token',
    });
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(oauthMock.getRefreshCallCount()).toBe(1);
    expect(mockAdapter.getCallCount()).toBe(2);
  });

  it('should not retry 401 more than once for OAuth (prevent infinite loop)', async () => {
    const oauthMock = createMockOAuthService({
      validToken: 'bad-token',
      refreshedToken: 'still-bad-token',
    });
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
      { status: 401, data: { error: { message: 'Still unauthorized' } } },
    ]);
    client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err: any) {
      // Second 401 after refresh should throw APIError, not retry again
      expect(err).toBeInstanceOf(APIError);
    }

    // Only one refresh attempt
    expect(oauthMock.getRefreshCallCount()).toBe(1);
  });

  it('should throw AUTH_EXPIRED when refresh fails on 401', async () => {
    const oauthMock = createMockOAuthService({
      validToken: 'expired-token',
      refreshShouldFail: true,
    });
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
    ]);
    client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(BBError);
      expect(err.code).toBe(ErrorCode.AUTH_EXPIRED);
      expect(err.message).toContain('bb auth login');
    }
  });

  it('should not attempt OAuth refresh on 401 for basic auth', async () => {
    const oauthMock = createMockOAuthService();
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
    ]);
    // basic auth config, but oauthService is provided
    client = createApiClient(
      mockConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(APIError);
      expect(err.code).toBe(ErrorCode.AUTH_INVALID);
    }

    // Should not have tried to refresh
    expect(oauthMock.getRefreshCallCount()).toBe(0);
  });
});

/**
 * Helper: creates an axios adapter with a per-URL response queue, so
 * concurrent requests to different paths each consume their own sequence.
 * Used to prove interceptor state is per-request, not per-instance.
 */
function createUrlKeyedAdapter(
  routes: Record<
    string,
    Array<{ status: number; data?: unknown; headers?: Record<string, string> }>
  >
) {
  const callCounts: Record<string, number> = {};
  const adapter = (config: { url?: string }) => {
    const url = config.url ?? '';
    const idx = callCounts[url] ?? 0;
    callCounts[url] = idx + 1;
    const queue = routes[url] ?? [];
    const resp = queue[idx] ?? queue[queue.length - 1];
    if (resp.status >= 200 && resp.status < 300) {
      return Promise.resolve({
        data: resp.data ?? {},
        status: resp.status,
        statusText: 'OK',
        headers: resp.headers ?? {},
        config,
      });
    }
    const error = new Error(`Request failed with status code ${resp.status}`);
    (error as any).response = {
      data: resp.data ?? {},
      status: resp.status,
      statusText: resp.status.toString(),
      headers: resp.headers ?? {},
      config,
    };
    (error as any).config = config;
    (error as any).isAxiosError = true;
    return Promise.reject(error);
  };
  return {
    adapter,
    getCallCount: (url: string) => callCounts[url] ?? 0,
  };
}

describe('createApiClient - shared instance concurrency', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('gives concurrent requests on one instance independent __tokenRefreshed guards (both 401 once, both replay)', async () => {
    const oauthMock = createMockOAuthService({
      validToken: 'expired-token',
      refreshedToken: 'new-token',
    });
    const mockAdapter = createUrlKeyedAdapter({
      '/a': [
        { status: 401, data: { error: { message: 'Unauthorized' } } },
        { status: 200, data: { route: 'a' } },
      ],
      '/b': [
        { status: 401, data: { error: { message: 'Unauthorized' } } },
        { status: 200, data: { route: 'b' } },
      ],
    });
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    const [respA, respB] = await Promise.all([
      client.get('/a'),
      client.get('/b'),
    ]);

    // Both requests recovered: each hit 401 once and replayed successfully.
    expect(respA.status).toBe(200);
    expect(respA.data).toEqual({ route: 'a' });
    expect(respB.status).toBe(200);
    expect(respB.data).toEqual({ route: 'b' });
    expect(mockAdapter.getCallCount('/a')).toBe(2);
    expect(mockAdapter.getCallCount('/b')).toBe(2);
    // The one-shot guard lives on each request's config, so each request
    // refreshed once — one request's guard did not suppress the other's.
    // (With the real OAuthService both calls collapse into one token POST via
    // the in-flight lock — see the parallel-401 test below.)
    expect(oauthMock.getRefreshCallCount()).toBe(2);
  });

  it('collapses parallel 401 refreshes into a single token POST (#259)', async () => {
    // Real OAuthService (not a mock) so the in-flight refresh lock is
    // exercised end-to-end: two requests on the shared axios instance both
    // hit 401, both enter the reactive refresh path, and exactly one POST
    // reaches the token endpoint. Bitbucket rotates refresh tokens, so a
    // second POST would carry an invalidated refresh_token and log the
    // user out.
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'revoked-server-side', // not expired locally, but 401s
      oauthRefreshToken: 'the-refresh-token',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const oauthService = new OAuthService(configService, configService);

    // OAuthService talks to the token endpoint via global fetch (axios is
    // only used for API calls). Gate the response so the refresh stays
    // in-flight until both 401s have entered the interceptor.
    const originalFetch = globalThis.fetch;
    let tokenPostCount = 0;
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    globalThis.fetch = (async () => {
      tokenPostCount++;
      await refreshGate;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'fresh-token',
          refresh_token: 'rotated-refresh',
          expires_in: 7200,
          token_type: 'bearer',
          scopes: '',
        }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const mockAdapter = createUrlKeyedAdapter({
        '/a': [
          { status: 401, data: { error: { message: 'Unauthorized' } } },
          { status: 200, data: { route: 'a' } },
        ],
        '/b': [
          { status: 401, data: { error: { message: 'Unauthorized' } } },
          { status: 200, data: { route: 'b' } },
        ],
      });
      const client = createApiClient(
        configService,
        createMockOutputService(),
        oauthService
      );
      client.defaults.adapter = mockAdapter.adapter as any;

      const inFlight = Promise.all([client.get('/a'), client.get('/b')]);

      // Give both requests real time to hit 401 and reach the refresh path
      // while the first refresh is still pending (setTimeout is stubbed to
      // run callbacks synchronously in this suite, so use the original).
      await new Promise((resolve) => originalSetTimeout(resolve, 20));
      releaseRefresh();

      const [respA, respB] = await inFlight;

      expect(respA.status).toBe(200);
      expect(respB.status).toBe(200);
      expect(mockAdapter.getCallCount('/a')).toBe(2);
      expect(mockAdapter.getCallCount('/b')).toBe(2);
      // Acceptance criterion: parallel 401s produce a single token POST.
      expect(tokenPostCount).toBe(1);

      // Both replays used the single refreshed token, and the rotated
      // refresh token was persisted once.
      const creds = await configService.getOAuthCredentials();
      expect(creds.accessToken).toBe('fresh-token');
      expect(creds.refreshToken).toBe('rotated-refresh');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('gives concurrent requests on one instance independent __retryCount budgets', async () => {
    const mockAdapter = createUrlKeyedAdapter({
      '/a': [
        { status: 503, data: {} },
        { status: 503, data: {} },
        { status: 503, data: {} },
        { status: 200, data: { route: 'a' } },
      ],
      '/b': [
        { status: 503, data: {} },
        { status: 200, data: { route: 'b' } },
      ],
    });
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    const [respA, respB] = await Promise.all([
      client.get('/a'),
      client.get('/b'),
    ]);

    // /a needed all 3 retries; /b only 1. If the counter were shared on the
    // instance, /a's failures would have exhausted /b's budget (or vice versa).
    expect(respA.status).toBe(200);
    expect(respB.status).toBe(200);
    expect(mockAdapter.getCallCount('/a')).toBe(4);
    expect(mockAdapter.getCallCount('/b')).toBe(2);
  });
});

describe('createApiClient - retry/backoff', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Make setTimeout resolve instantly to avoid real delays
    stubSetTimeout();

    // Suppress retry log noise in test output
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('returns response on successful request without retry', async () => {
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(mockAdapter.getCallCount()).toBe(1);
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    const mockAdapter = createMockAdapter([
      { status: 429, data: { error: { message: 'Rate limited' } } },
      { status: 200, data: { ok: true } },
    ]);
    const output = createMockOutputService();
    client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(mockAdapter.getCallCount()).toBe(2);
    expect(output.logs.some((l) => l.startsWith('warning:Rate limited'))).toBe(
      true
    );
  });

  it('retries on 502 and succeeds on second attempt', async () => {
    const mockAdapter = createMockAdapter([
      { status: 502, data: {} },
      { status: 200, data: { recovered: true } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ recovered: true });
    expect(mockAdapter.getCallCount()).toBe(2);
  });

  it('throws APIError with API_RATE_LIMITED after exhausting retries on 429', async () => {
    // 3 retries + 1 initial = 4 calls total, all returning 429
    const mockAdapter = createMockAdapter([
      { status: 429, data: { error: { message: 'Rate limited' } } },
      { status: 429, data: { error: { message: 'Rate limited' } } },
      { status: 429, data: { error: { message: 'Rate limited' } } },
      { status: 429, data: { error: { message: 'Rate limited' } } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      const apiErr = err as APIError;
      expect(apiErr.code).toBe(ErrorCode.API_RATE_LIMITED);
      expect(apiErr.statusCode).toBe(429);
    }

    // 1 initial + 3 retries = 4 calls
    expect(mockAdapter.getCallCount()).toBe(4);
  });

  it('throws immediately on 404 without retrying', async () => {
    const mockAdapter = createMockAdapter([
      { status: 404, data: { error: { message: 'Not found' } } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      const apiErr = err as APIError;
      expect(apiErr.code).toBe(ErrorCode.API_NOT_FOUND);
      expect(apiErr.statusCode).toBe(404);
    }

    expect(mockAdapter.getCallCount()).toBe(1);
  });

  it('throws immediately on 401 without retrying', async () => {
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      const apiErr = err as APIError;
      expect(apiErr.code).toBe(ErrorCode.AUTH_INVALID);
      expect(apiErr.statusCode).toBe(401);
    }

    expect(mockAdapter.getCallCount()).toBe(1);
  });

  it('respects Retry-After header on 429', async () => {
    const setTimeoutCalls: number[] = [];
    // Override setTimeout to track the delay values
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as any;
    }) as any;

    const mockAdapter = createMockAdapter([
      {
        status: 429,
        data: { error: { message: 'Rate limited' } },
        headers: { 'retry-after': '5' },
      },
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(mockAdapter.getCallCount()).toBe(2);
    // The retry delay should be 5000ms (5 seconds from Retry-After header)
    expect(setTimeoutCalls).toContain(5000);
  });

  it('throws BBError with NETWORK_ERROR on network failure', async () => {
    const networkMock = createNetworkErrorAdapter();
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      const bbErr = err as BBError;
      expect(bbErr.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(bbErr.message).toContain(
        'Network error: Unable to reach Bitbucket API'
      );
      expect(bbErr.message).toContain('DEBUG=true');
    }

    // Network errors without a recognized transient `code` are not retried
    expect(networkMock.getCallCount()).toBe(1);
  });
});

describe('createApiClient - authentication header', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('sends Basic auth header derived from username + apiToken', async () => {
    let capturedAuth: string | undefined;
    const adapter = (config: unknown) => {
      capturedAuth = (
        config as {
          headers: { Authorization?: string };
        }
      ).headers.Authorization;
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };

    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = adapter as any;

    await client.get('/test');

    expect(capturedAuth).toBeDefined();
    expect(capturedAuth).toStartWith('Basic ');
    const decoded = Buffer.from(
      capturedAuth!.replace('Basic ', ''),
      'base64'
    ).toString();
    expect(decoded).toBe('testuser:testtoken');
  });

  it('sends Bearer token from OAuth service when auth method is oauth', async () => {
    let capturedAuth: string | undefined;
    const adapter = (config: unknown) => {
      capturedAuth = (
        config as {
          headers: { Authorization?: string };
        }
      ).headers.Authorization;
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };

    const oauthMock = createMockOAuthService({
      validToken: 'the-bearer-token',
    });
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = adapter as any;

    await client.get('/test');

    expect(capturedAuth).toBe('Bearer the-bearer-token');
  });
});

describe('createApiClient - Retry-After parsing', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('uses exponential backoff when Retry-After is not set', async () => {
    const setTimeoutCalls: number[] = [];
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as any;
    }) as any;

    const mockAdapter = createMockAdapter([
      { status: 429, data: {} },
      { status: 429, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    // First retry: 1000ms * 2^(1-1) = 1000
    // Second retry: 1000ms * 2^(2-1) = 2000
    expect(setTimeoutCalls).toContain(1000);
    expect(setTimeoutCalls).toContain(2000);
  });

  it('falls back to exponential backoff when Retry-After is non-numeric', async () => {
    const setTimeoutCalls: number[] = [];
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as any;
    }) as any;

    const mockAdapter = createMockAdapter([
      {
        status: 429,
        data: {},
        headers: { 'retry-after': 'garbage' },
      },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    expect(setTimeoutCalls).toContain(1000);
    expect(setTimeoutCalls).not.toContain(Number.NaN);
  });

  it('does not use Retry-After delay for non-429 retryable statuses', async () => {
    const setTimeoutCalls: number[] = [];
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as any;
    }) as any;

    const mockAdapter = createMockAdapter([
      {
        status: 503,
        data: {},
        headers: { 'retry-after': '99' },
      },
      { status: 200, data: { ok: true } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    // 503 uses exponential backoff, not Retry-After.
    expect(setTimeoutCalls).toContain(1000);
    expect(setTimeoutCalls).not.toContain(99000);
  });
});

describe('createApiClient - error message extraction', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('extracts nested error.message from response body', async () => {
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: { error: { message: 'Bitbucket: invalid field' } },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      expect((err as APIError).message).toBe('Bitbucket: invalid field');
    }
  });

  // Bitbucket answers a rejected payload with a terse "Bad request" plus an
  // error.fields map naming each offending key. Without the map the message is
  // undebuggable, so append it.
  it('appends error.fields detail to the message', async () => {
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: {
          error: {
            message: 'Bad request',
            fields: {
              type: 'extra keys not allowed',
              'parent.type': 'extra keys not allowed',
            },
          },
        },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      const message = (err as APIError).message;
      expect(message).toContain('Bad request');
      expect(message).toContain('type: extra keys not allowed');
      expect(message).toContain('parent.type: extra keys not allowed');
    }
  });

  it('joins array-valued field errors', async () => {
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: {
          error: {
            message: 'Bad request',
            fields: { title: ['required', 'too long'] },
          },
        },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect((err as APIError).message).toContain('title: required, too long');
    }
  });

  it('leaves the message untouched when fields is absent or empty', async () => {
    const mockAdapter = createMockAdapter([
      { status: 400, data: { error: { message: 'Bad request', fields: {} } } },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect((err as APIError).message).toBe('Bad request');
    }
  });

  it('falls back to top-level message field', async () => {
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: { message: 'Flat error message' },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect((err as APIError).message).toBe('Flat error message');
    }
  });

  it('falls back to axios error.message when no body message exists', async () => {
    const mockAdapter = createMockAdapter([{ status: 418, data: null }]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect((err as APIError).message).toContain('418');
    }
  });

  it('ignores error.message that is not a string', async () => {
    const mockAdapter = createMockAdapter([
      {
        status: 400,
        data: { error: { message: { nested: 'object' } } },
      },
    ]);
    const client = createApiClient(
      mockConfigService(),
      createMockOutputService()
    );
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(typeof (err as APIError).message).toBe('string');
      expect((err as APIError).message).not.toBe('[object Object]');
    }
  });
});

describe('createApiClient - retry messages route through IOutputService', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let consoleWarnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('routes 429 retry notice through output.warning() rather than console.error', async () => {
    const mockAdapter = createMockAdapter([
      { status: 429, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const output = createMockOutputService();
    const client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    const warnings = output.logs.filter((l) => l.startsWith('warning:'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Rate limited');
    expect(warnings[0]).toContain('attempt 1/3');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('labels non-429 retryable statuses as "Server error"', async () => {
    const mockAdapter = createMockAdapter([
      { status: 503, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const output = createMockOutputService();
    const client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    const warnings = output.logs.filter((l) => l.startsWith('warning:'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Server error (503)');
  });

  it('emits one warning per retry attempt before exhausting', async () => {
    const mockAdapter = createMockAdapter([
      { status: 429, data: {} },
      { status: 429, data: {} },
      { status: 429, data: {} },
      { status: 429, data: {} },
    ]);
    const output = createMockOutputService();
    const client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch {
      // expected
    }

    const warnings = output.logs.filter((l) => l.startsWith('warning:'));
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toContain('attempt 1/3');
    expect(warnings[1]).toContain('attempt 2/3');
    expect(warnings[2]).toContain('attempt 3/3');
  });

  it('suppresses retry warnings when output is in JSON mode', async () => {
    const mockAdapter = createMockAdapter([
      { status: 429, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    const output = createMockOutputService();
    output.setJsonFormatOptions({ json: true });
    const client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    const warnings = output.logs.filter((l) => l.startsWith('warning:'));
    expect(warnings).toHaveLength(0);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('does not emit any warning when the first attempt succeeds', async () => {
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    const output = createMockOutputService();
    const client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    const warnings = output.logs.filter((l) => l.startsWith('warning:'));
    expect(warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Issue #249: request timeout on the main API axios instance.
// ---------------------------------------------------------------------------

describe('createApiClient - request timeout (#249)', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let originalTimeoutEnv: string | undefined;

  beforeEach(() => {
    originalTimeoutEnv = process.env.BB_HTTP_TIMEOUT;
    // Make sleep() instant in case any path retries.
    globalThis.setTimeout = ((
      fn: (...args: unknown[]) => void,
      _ms?: number
    ) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout;
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
    if (originalTimeoutEnv === undefined) {
      delete process.env.BB_HTTP_TIMEOUT;
    } else {
      process.env.BB_HTTP_TIMEOUT = originalTimeoutEnv;
    }
  });

  it('applies the default 30000ms timeout to the axios instance', () => {
    delete process.env.BB_HTTP_TIMEOUT;
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(30000);
  });

  it('honors BB_HTTP_TIMEOUT as the instance timeout', () => {
    process.env.BB_HTTP_TIMEOUT = '5000';
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(5000);
  });

  it('falls back to the default when BB_HTTP_TIMEOUT is non-numeric', () => {
    process.env.BB_HTTP_TIMEOUT = 'not-a-number';
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(30000);
  });

  it('falls back to the default when BB_HTTP_TIMEOUT is negative', () => {
    process.env.BB_HTTP_TIMEOUT = '-1000';
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(30000);
  });

  it('falls back to the default when BB_HTTP_TIMEOUT is empty/whitespace', () => {
    process.env.BB_HTTP_TIMEOUT = '   ';
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(30000);
  });

  it('treats BB_HTTP_TIMEOUT="0" as disabled (no timeout)', () => {
    process.env.BB_HTTP_TIMEOUT = '0';
    client = createApiClient(mockConfigService(), createMockOutputService());
    expect(client.defaults.timeout).toBe(0);
  });

  it('maps a timeout (ECONNABORTED, request set, no response) to NETWORK_ERROR', async () => {
    delete process.env.BB_HTTP_TIMEOUT;
    const timeoutMock = createTimeoutErrorAdapter('ECONNABORTED');
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = timeoutMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      expect((err as BBError).code).toBe(ErrorCode.NETWORK_ERROR);
    }

    // Timeouts on idempotent requests are retried (issue #267):
    // 1 initial + 3 retries = 4 attempts before the error surfaces.
    expect(timeoutMock.getCallCount()).toBe(4);
  });

  it('also maps ETIMEDOUT timeouts to NETWORK_ERROR', async () => {
    delete process.env.BB_HTTP_TIMEOUT;
    const timeoutMock = createTimeoutErrorAdapter('ETIMEDOUT');
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = timeoutMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      expect((err as BBError).code).toBe(ErrorCode.NETWORK_ERROR);
    }
    // 1 initial + 3 network-error retries (issue #267)
    expect(timeoutMock.getCallCount()).toBe(4);
  });

  it('surfaces a timeout-specific message distinct from the generic network error', async () => {
    delete process.env.BB_HTTP_TIMEOUT;
    const timeoutMock = createTimeoutErrorAdapter('ECONNABORTED');
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = timeoutMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      const bbErr = err as BBError;
      expect(bbErr.code).toBe(ErrorCode.NETWORK_ERROR);
      // Distinct, actionable copy rather than the generic network message.
      expect(bbErr.message.toLowerCase()).toContain('timed out');
      expect(bbErr.message).toContain('BB_HTTP_TIMEOUT');
      // Original axios error preserved as cause for DEBUG/troubleshooting.
      expect(bbErr.cause).toBe(timeoutMock.getLastError());
    }
  });

  it('keeps the generic network message for connection errors without a timeout code', async () => {
    delete process.env.BB_HTTP_TIMEOUT;
    const networkMock = createNetworkErrorAdapter();
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      const bbErr = err as BBError;
      expect(bbErr.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(bbErr.message).toContain('Unable to reach Bitbucket API');
      expect(bbErr.message.toLowerCase()).not.toContain('timed out');
    }
  });
});

// ---------------------------------------------------------------------------
// Issue #267: retry transient network errors (no response received) on
// idempotent requests.
// ---------------------------------------------------------------------------

describe('createApiClient - transient network error retry (#267)', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Make sleep() instant so retries don't slow down the suite.
    stubSetTimeout();
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreSetTimeout();
    consoleErrorSpy.mockRestore();
  });

  it('retries GET on ECONNRESET and succeeds once the connection recovers', async () => {
    const networkMock = createNetworkErrorAdapter({
      code: 'ECONNRESET',
      succeedAfter: 1,
    });
    const output = createMockOutputService();
    client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = networkMock.adapter as never;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(networkMock.getCallCount()).toBe(2);
    expect(
      output.logs.some((l) =>
        l.startsWith('warning:Network error (ECONNRESET)')
      )
    ).toBe(true);
  });

  it('retries GET on EAI_AGAIN (temporary DNS failure) and succeeds', async () => {
    const networkMock = createNetworkErrorAdapter({
      code: 'EAI_AGAIN',
      succeedAfter: 2,
    });
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as never;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    // 2 failures + 1 success
    expect(networkMock.getCallCount()).toBe(3);
  });

  it('retries ETIMEDOUT up to MAX_RETRIES then throws NETWORK_ERROR with the timeout message', async () => {
    const timeoutMock = createTimeoutErrorAdapter('ETIMEDOUT');
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = timeoutMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      const bbErr = err as BBError;
      expect(bbErr.code).toBe(ErrorCode.NETWORK_ERROR);
      // Final-failure mapping is preserved: timeout-specific copy with the
      // BB_HTTP_TIMEOUT hint.
      expect(bbErr.message.toLowerCase()).toContain('timed out');
      expect(bbErr.message).toContain('BB_HTTP_TIMEOUT');
    }

    // 1 initial attempt + MAX_RETRIES (3) retries = 4 attempts total.
    expect(timeoutMock.getCallCount()).toBe(4);
  });

  it('does NOT retry POST on ECONNRESET (non-idempotent method)', async () => {
    const networkMock = createNetworkErrorAdapter({ code: 'ECONNRESET' });
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as never;

    try {
      await client.post('/test', { body: true });
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      expect((err as BBError).code).toBe(ErrorCode.NETWORK_ERROR);
    }

    expect(networkMock.getCallCount()).toBe(1);
  });

  it('does NOT retry GET on ECONNREFUSED (permanent until fixed)', async () => {
    const networkMock = createNetworkErrorAdapter({ code: 'ECONNREFUSED' });
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      expect((err as BBError).code).toBe(ErrorCode.NETWORK_ERROR);
    }

    expect(networkMock.getCallCount()).toBe(1);
  });

  it('uses exponential backoff delays (1s/2s/4s) for network retries', async () => {
    const setTimeoutCalls: number[] = [];
    globalThis.setTimeout = ((fn: Function, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      fn();
      return 0 as any;
    }) as any;

    const networkMock = createNetworkErrorAdapter({ code: 'ECONNRESET' });
    client = createApiClient(mockConfigService(), createMockOutputService());
    client.defaults.adapter = networkMock.adapter as never;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect((err as BBError).code).toBe(ErrorCode.NETWORK_ERROR);
    }

    expect(setTimeoutCalls).toContain(1000);
    expect(setTimeoutCalls).toContain(2000);
    expect(setTimeoutCalls).toContain(4000);
  });

  it('suppresses network retry warnings in --json mode', async () => {
    const networkMock = createNetworkErrorAdapter({
      code: 'ECONNRESET',
      succeedAfter: 1,
    });
    const output = createMockOutputService();
    output.setJsonFormatOptions({ json: true });
    client = createApiClient(mockConfigService(), output);
    client.defaults.adapter = networkMock.adapter as never;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(networkMock.getCallCount()).toBe(2);
    expect(output.logs.filter((l) => l.startsWith('warning:'))).toHaveLength(0);
  });
});
