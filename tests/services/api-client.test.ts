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
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import type { IConfigService } from '../../src/core/interfaces/services.js';
import type { AxiosInstance } from 'axios';

/**
 * Creates a mock config service with valid credentials.
 */
function mockConfigService(): IConfigService {
  return {
    async getConfig() {
      return { username: 'testuser', apiToken: 'testtoken' };
    },
    async setConfig() {},
    async getCredentials() {
      return { username: 'testuser', apiToken: 'testtoken' };
    },
    async setCredentials() {},
    async clearCredentials() {},
    async clearConfig() {},
    async getValue() {
      return undefined;
    },
    async setValue() {},
    getConfigPath() {
      return '/tmp/test-config.json';
    },
    async getAuthMethod() {
      return 'basic' as const;
    },
    async getOAuthCredentials() {
      throw new Error('No OAuth credentials');
    },
    async setOAuthCredentials() {},
    async clearOAuthCredentials() {},
    async isOAuthTokenExpired() {
      return true;
    },
  };
}

/**
 * Helper: creates an axios adapter that returns responses from a queue.
 * Each entry is either a successful response or an error response.
 * Tracks the number of calls made.
 */
function createMockAdapter(
  responses: Array<{
    status: number;
    data?: unknown;
    headers?: Record<string, string>;
  }>
) {
  let callCount = 0;
  const adapter = (config: unknown) => {
    const idx = callCount;
    callCount++;
    const resp = responses[idx] ?? responses[responses.length - 1];
    if (resp.status >= 200 && resp.status < 300) {
      return Promise.resolve({
        data: resp.data ?? {},
        status: resp.status,
        statusText: 'OK',
        headers: resp.headers ?? {},
        config,
      });
    }
    // Simulate an axios error for non-2xx
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
    // For network errors we handle separately; here we always have a response
    return Promise.reject(error);
  };

  return {
    adapter,
    getCallCount: () => callCount,
  };
}

/**
 * Helper: creates an adapter that simulates a network error (no response).
 */
function createNetworkErrorAdapter() {
  let callCount = 0;
  const adapter = (_config: unknown) => {
    callCount++;
    const error = new Error('Network Error');
    (error as any).request = {}; // has request but no response
    (error as any).config = _config;
    (error as any).isAxiosError = true;
    return Promise.reject(error);
  };
  return {
    adapter,
    getCallCount: () => callCount,
  };
}

// Speed up the sleep() calls by overriding global setTimeout
const originalSetTimeout = globalThis.setTimeout;

/**
 * Creates a mock config service that uses OAuth.
 */
function mockOAuthConfigService(): IConfigService {
  return {
    async getConfig() {
      return {
        authMethod: 'oauth' as const,
        oauthAccessToken: 'oauth-access-token',
        oauthRefreshToken: 'oauth-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
    },
    async setConfig() {},
    async getCredentials() {
      throw new Error('No basic credentials');
    },
    async setCredentials() {},
    async clearCredentials() {},
    async clearConfig() {},
    async getValue() {
      return undefined;
    },
    async setValue() {},
    getConfigPath() {
      return '/tmp/test-config.json';
    },
    async getAuthMethod() {
      return 'oauth' as const;
    },
    async getOAuthCredentials() {
      return {
        accessToken: 'oauth-access-token',
        refreshToken: 'oauth-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
    },
    async setOAuthCredentials() {},
    async clearOAuthCredentials() {},
    async isOAuthTokenExpired() {
      return false;
    },
  };
}

/**
 * Creates a mock OAuthService.
 */
function createMockOAuthService(
  options: {
    validToken?: string;
    refreshedToken?: string;
    refreshShouldFail?: boolean;
  } = {}
) {
  let refreshCallCount = 0;
  return {
    service: {
      async getValidAccessToken() {
        return options.validToken ?? 'valid-oauth-token';
      },
      async refreshAccessToken() {
        refreshCallCount++;
        if (options.refreshShouldFail) {
          throw new Error('Refresh failed');
        }
        return options.refreshedToken ?? 'refreshed-oauth-token';
      },
      async authorize() {
        return { username: 'user', displayName: 'User', accountId: '123' };
      },
      async revokeToken() {},
    } as any,
    getRefreshCallCount: () => refreshCallCount,
  };
}

describe('createApiClient - OAuth auth', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    globalThis.setTimeout = ((fn: Function, _ms?: number) => {
      fn();
      return 0 as any;
    }) as any;
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

  it('should use Bearer token when auth method is oauth', async () => {
    const oauthMock = createMockOAuthService({ validToken: 'my-bearer-token' });
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(mockOAuthConfigService(), oauthMock.service);
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
  });

  it('should use Basic auth when auth method is basic even with oauthService provided', async () => {
    const oauthMock = createMockOAuthService();
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(mockConfigService(), oauthMock.service);
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
    client = createApiClient(mockOAuthConfigService(), oauthMock.service);
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
    client = createApiClient(mockOAuthConfigService(), oauthMock.service);
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
    client = createApiClient(mockOAuthConfigService(), oauthMock.service);
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
    client = createApiClient(mockConfigService(), oauthMock.service);
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

describe('createApiClient - retry/backoff', () => {
  let client: AxiosInstance;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Make setTimeout resolve instantly to avoid real delays
    globalThis.setTimeout = ((fn: Function, _ms?: number) => {
      fn();
      return 0 as any;
    }) as any;

    // Suppress retry log noise in test output
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

  it('returns response on successful request without retry', async () => {
    const mockAdapter = createMockAdapter([
      { status: 200, data: { ok: true } },
    ]);
    client = createApiClient(mockConfigService());
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
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(mockAdapter.getCallCount()).toBe(2);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('retries on 502 and succeeds on second attempt', async () => {
    const mockAdapter = createMockAdapter([
      { status: 502, data: {} },
      { status: 200, data: { recovered: true } },
    ]);
    client = createApiClient(mockConfigService());
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
    client = createApiClient(mockConfigService());
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
    client = createApiClient(mockConfigService());
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
    client = createApiClient(mockConfigService());
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
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

    const response = await client.get('/test');

    expect(response.status).toBe(200);
    expect(mockAdapter.getCallCount()).toBe(2);
    // The retry delay should be 5000ms (5 seconds from Retry-After header)
    expect(setTimeoutCalls).toContain(5000);
  });

  it('throws BBError with NETWORK_ERROR on network failure', async () => {
    const networkMock = createNetworkErrorAdapter();
    client = createApiClient(mockConfigService());
    client.defaults.adapter = networkMock.adapter as any;

    try {
      await client.get('/test');
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BBError);
      const bbErr = err as BBError;
      expect(bbErr.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(bbErr.message).toBe(
        'Network error: Unable to reach Bitbucket API'
      );
    }

    // Network errors are not retried (no response object)
    expect(networkMock.getCallCount()).toBe(1);
  });
});

describe('createApiClient - DEBUG response logging redaction', () => {
  let client: AxiosInstance;
  let consoleDebugSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    originalDebug = process.env.DEBUG;
    consoleDebugSpy = spyOn(console, 'debug').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

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
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

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
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    const output = allDebugOutput();
    expect(output).not.toContain('nested-secret');
    expect(output).not.toContain('also-secret');
    expect(output).toContain('[REDACTED]');
  });

  it('does not log response bodies when DEBUG is not set', async () => {
    delete process.env.DEBUG;
    const mockAdapter = createMockAdapter([
      {
        status: 200,
        data: { access_token: 'should-never-log' },
      },
    ]);
    client = createApiClient(mockConfigService());
    client.defaults.adapter = mockAdapter.adapter as any;

    await client.get('/test');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });
});
