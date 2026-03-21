/**
 * OAuthService tests
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
import { OAuthService } from '../../src/services/oauth.service.js';
import { createMockConfigService } from '../setup.js';
import { ErrorCode } from '../../src/types/errors.js';

// Mock fetch globally for token exchange/refresh/revoke tests
const originalFetch = globalThis.fetch;

function mockFetch(
  responses: Array<{
    ok: boolean;
    status: number;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  }>
) {
  let callIndex = 0;
  const calls: { url: string; options: RequestInit }[] = [];

  globalThis.fetch = (async (
    url: string | URL | Request,
    options?: RequestInit
  ) => {
    calls.push({ url: url.toString(), options: options ?? {} });
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return resp;
  }) as typeof fetch;

  return {
    getCalls: () => calls,
    getCallCount: () => calls.length,
  };
}

describe('OAuthService', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  describe('getValidAccessToken', () => {
    it('should return existing token when not expired', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'my-access-token',
        oauthRefreshToken: 'my-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });
      const service = new OAuthService(configService);

      const token = await service.getValidAccessToken();

      expect(token).toBe('my-access-token');
    });

    it('should refresh token when expired', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'old-token',
        oauthRefreshToken: 'my-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100, // expired
      });
      const service = new OAuthService(configService);

      const fetchMock = mockFetch([
        {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 7200,
            token_type: 'bearer',
            scopes: 'account repository',
          }),
        },
      ]);

      const token = await service.getValidAccessToken();

      expect(token).toBe('new-access-token');
      expect(fetchMock.getCallCount()).toBe(1);

      // Verify new credentials were stored
      const creds = await configService.getOAuthCredentials();
      expect(creds.accessToken).toBe('new-access-token');
      expect(creds.refreshToken).toBe('new-refresh-token');
    });

    it('should refresh token when within 60 seconds of expiry', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'almost-expired-token',
        oauthRefreshToken: 'my-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now (within 60s buffer)
      });
      const service = new OAuthService(configService);

      mockFetch([
        {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'refreshed-token',
            refresh_token: 'new-refresh',
            expires_in: 7200,
            token_type: 'bearer',
            scopes: '',
          }),
        },
      ]);

      const token = await service.getValidAccessToken();

      expect(token).toBe('refreshed-token');
    });
  });

  describe('refreshAccessToken', () => {
    it('should send correct request to token endpoint', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'old-token',
        oauthRefreshToken: 'the-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
      });
      const service = new OAuthService(configService);

      const fetchMock = mockFetch([
        {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 7200,
            token_type: 'bearer',
            scopes: '',
          }),
        },
      ]);

      await service.refreshAccessToken();

      const call = fetchMock.getCalls()[0];
      expect(call.url).toContain('oauth2/access_token');
      expect(call.options.method).toBe('POST');

      // Verify Basic auth header is present
      const authHeader = (call.options.headers as Record<string, string>)[
        'Authorization'
      ];
      expect(authHeader).toStartWith('Basic ');

      // Verify body contains refresh_token grant type
      const body = call.options.body as string;
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=the-refresh-token');
    });

    it('should throw AUTH_EXPIRED when refresh fails', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'old-token',
        oauthRefreshToken: 'bad-refresh-token',
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
      });
      const service = new OAuthService(configService);

      mockFetch([
        {
          ok: false,
          status: 401,
          text: async () => 'invalid_grant',
        },
      ]);

      try {
        await service.refreshAccessToken();
        expect(true).toBe(false); // should not reach
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.AUTH_EXPIRED);
        expect(err.message).toContain('bb auth login');
      }
    });

    it('should use custom client credentials when stored', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'token',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
        oauthClientId: 'custom-id',
        oauthClientSecret: 'custom-secret',
      });
      const service = new OAuthService(configService);

      const fetchMock = mockFetch([
        {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'new',
            refresh_token: 'new-refresh',
            expires_in: 7200,
            token_type: 'bearer',
            scopes: '',
          }),
        },
      ]);

      await service.refreshAccessToken();

      const call = fetchMock.getCalls()[0];
      const authHeader = (call.options.headers as Record<string, string>)[
        'Authorization'
      ];
      const decoded = Buffer.from(
        authHeader.replace('Basic ', ''),
        'base64'
      ).toString();
      expect(decoded).toBe('custom-id:custom-secret');
    });
  });

  describe('revokeToken', () => {
    it('should send revocation request', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'token-to-revoke',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
      const service = new OAuthService(configService);

      const fetchMock = mockFetch([
        { ok: true, status: 200 },
      ]);

      await service.revokeToken();

      expect(fetchMock.getCallCount()).toBe(1);
      const call = fetchMock.getCalls()[0];
      expect(call.url).toContain('oauth2/revoke');
      const body = call.options.body as string;
      expect(body).toContain('token=token-to-revoke');
    });

    it('should not throw when revocation fails', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'token',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
      const service = new OAuthService(configService);

      mockFetch([{ ok: false, status: 500 }]);

      // Should not throw
      await service.revokeToken();
    });

    it('should not throw when no credentials exist', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService);

      // getOAuthCredentials will throw, but revokeToken catches it
      await service.revokeToken();
    });
  });
});
