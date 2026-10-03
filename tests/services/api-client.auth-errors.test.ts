/**
 * Already-classified failures must keep their code through the interceptor
 * chain: axios routes request-interceptor rejections (credentials, config
 * permissions, OAuth refresh) into the response error handler, which used to
 * re-wrap them as UNKNOWN.
 */

import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'bun:test';
import { createApiClient } from '../../src/services/api-client.service.js';
import { ConfigService } from '../../src/services/config.service.js';
import { CredentialStore } from '../../src/services/credential-store.service.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockAdapter,
  createMockOAuthService,
  createMockOutputService,
  createMockSecretStorage,
  mockOAuthConfigService,
} from '../setup.js';

describe('createApiClient - BBError passthrough', () => {
  async function requestWithConfigDir(
    prepare: (dir: string) => Promise<void>
  ): Promise<{ error: unknown; adapterCalls: number }> {
    const dir = await mkdtemp(join(tmpdir(), 'bb-api-client-'));
    try {
      await prepare(dir);
      const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
      const client = createApiClient(
        new CredentialStore(
          new ConfigService(dir),
          createMockSecretStorage(),
          {}
        ),
        createMockOutputService()
      );
      client.defaults.adapter = mockAdapter.adapter;
      const error = await client.get('/test').catch((e: unknown) => e);
      return { error, adapterCalls: mockAdapter.getCallCount() };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it('keeps AUTH_REQUIRED when basic-auth credentials are missing', async () => {
    const { error, adapterCalls } = await requestWithConfigDir(async () => {});

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.AUTH_REQUIRED);
    expect((error as BBError).message).toContain('bb auth login');
    expect(adapterCalls).toBe(0);
  });

  it.skipIf(process.platform === 'win32')(
    'keeps CONFIG_READ_FAILED when the config directory is world-readable',
    async () => {
      const { error, adapterCalls } = await requestWithConfigDir(
        async (dir) => {
          await writeFile(
            join(dir, 'config.json'),
            JSON.stringify({ username: 'u', apiToken: 't' }),
            { mode: 0o600 }
          );
          await chmod(dir, 0o755);
        }
      );

      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.CONFIG_READ_FAILED);
      expect((error as BBError).message).toContain('insecure permissions');
      expect(adapterCalls).toBe(0);
    }
  );

  it('keeps AUTH_EXPIRED when the proactive OAuth refresh fails', async () => {
    const refreshError = new BBError({
      code: ErrorCode.AUTH_EXPIRED,
      message: 'Failed to refresh OAuth token. (invalid_grant)',
    });
    const oauthService = {
      ...createMockOAuthService().service,
      async getValidAccessToken(): Promise<string> {
        throw refreshError;
      },
    } as never;
    const mockAdapter = createMockAdapter([{ status: 200, data: {} }]);
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthService
    );
    client.defaults.adapter = mockAdapter.adapter;

    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBe(refreshError);
    expect(mockAdapter.getCallCount()).toBe(0);
  });

  it('keeps the refresh error when the reactive 401 refresh fails', async () => {
    const refreshError = new BBError({
      code: ErrorCode.AUTH_EXPIRED,
      message: 'Failed to refresh OAuth token. (invalid_grant)',
    });
    const oauthService = {
      ...createMockOAuthService().service,
      async refreshAccessToken(): Promise<string> {
        throw refreshError;
      },
    } as never;
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
    ]);
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthService
    );
    client.defaults.adapter = mockAdapter.adapter;

    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBe(refreshError);
  });

  it('reports the replayed request failure after a successful 401 refresh', async () => {
    const oauthMock = createMockOAuthService();
    const mockAdapter = createMockAdapter([
      { status: 401, data: { error: { message: 'Unauthorized' } } },
      { status: 403, data: { error: { message: 'Forbidden' } } },
    ]);
    const client = createApiClient(
      mockOAuthConfigService(),
      createMockOutputService(),
      oauthMock.service
    );
    client.defaults.adapter = mockAdapter.adapter;

    const error = await client.get('/test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(APIError);
    expect((error as APIError).code).toBe(ErrorCode.API_FORBIDDEN);
    expect(oauthMock.getRefreshCallCount()).toBe(1);
  });
});
