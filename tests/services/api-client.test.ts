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
