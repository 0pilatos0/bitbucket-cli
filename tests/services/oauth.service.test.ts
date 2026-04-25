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
import { createServer, type Server } from 'node:http';
import { OAuthService } from '../../src/services/oauth.service.js';
import { createMockConfigService } from '../setup.js';
import { ErrorCode } from '../../src/types/errors.js';

// Preserve the real fetch so the test can hit the local callback server.
const originalFetch = globalThis.fetch;

// The OAuth service dynamically imports 'open' to launch the browser.
// We mock it so tests never spawn a real browser and we can inspect the
// auth URL (which carries the state parameter we need to echo back).
const openMock = mock(async (_url: string) => undefined);
mock.module('open', () => ({ default: openMock }));

const CALLBACK_PORT = 19872;
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;

interface FetchResponse {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}

function mockFetch(responses: FetchResponse[]) {
  let callIndex = 0;
  const calls: { url: string; options: RequestInit }[] = [];

  globalThis.fetch = (async (
    url: string | URL | Request,
    options?: RequestInit
  ) => {
    const urlStr = url.toString();

    // Pass through localhost traffic so the test can hit the real callback
    // server the OAuthService started.
    if (urlStr.startsWith('http://localhost:')) {
      return originalFetch(url, options);
    }

    calls.push({ url: urlStr, options: options ?? {} });
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return resp as unknown as Response;
  }) as typeof fetch;

  return {
    getCalls: () => calls,
    getCallCount: () => calls.length,
  };
}

async function waitForBrowserOpen(timeoutMs = 2000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (openMock.mock.calls.length > 0) {
      const [authUrl] = openMock.mock.calls[0];
      return authUrl as string;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('open() was never called within timeout');
}

function extractState(authUrl: string): string {
  const url = new URL(authUrl);
  const state = url.searchParams.get('state');
  if (!state) {
    throw new Error('auth URL missing state parameter');
  }
  return state;
}

/**
 * Wrap a promise so its rejection is immediately handled. Returns a
 * promise that resolves to {value} on success or {error} on failure.
 *
 * Needed because the OAuth service rejects from inside an HTTP server
 * handler — the rejection fires before the test code reaches `await`,
 * and Bun flags it as unhandled even though we intend to assert on it.
 */
function outcome<T>(
  promise: Promise<T>
): Promise<{ value?: T; error?: unknown }> {
  return promise.then(
    (value) => ({ value }),
    (error) => ({ error })
  );
}

describe('OAuthService', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    openMock.mockClear();
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
      const service = new OAuthService(configService, configService);

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
      const service = new OAuthService(configService, configService);

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
      const service = new OAuthService(configService, configService);

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
      const service = new OAuthService(configService, configService);

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
      const service = new OAuthService(configService, configService);

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
      const service = new OAuthService(configService, configService);

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

    it('should persist updated expiresAt as a unix timestamp in seconds', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'old',
        oauthRefreshToken: 'rt',
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
      });
      const service = new OAuthService(configService, configService);

      mockFetch([
        {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'at',
            refresh_token: 'rt',
            expires_in: 3600,
            token_type: 'bearer',
            scopes: '',
          }),
        },
      ]);

      const nowSeconds = Math.floor(Date.now() / 1000);
      await service.refreshAccessToken();

      const creds = await configService.getOAuthCredentials();
      // Allow up to 5s of slack for slow CI
      expect(creds.expiresAt).toBeGreaterThanOrEqual(nowSeconds + 3600 - 5);
      expect(creds.expiresAt).toBeLessThanOrEqual(nowSeconds + 3600 + 5);
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
      const service = new OAuthService(configService, configService);

      const fetchMock = mockFetch([{ ok: true, status: 200 }]);

      await service.revokeToken();

      expect(fetchMock.getCallCount()).toBe(1);
      const call = fetchMock.getCalls()[0];
      expect(call.url).toContain('oauth2/revoke');
      const body = call.options.body as string;
      expect(body).toContain('token=token-to-revoke');
    });

    it('should throw when revocation returns non-ok status', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'token',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
      const service = new OAuthService(configService, configService);

      mockFetch([{ ok: false, status: 500, text: async () => 'oops' }]);

      const result = await outcome(service.revokeToken());
      expect(result.error).toBeDefined();
      const err = result.error as { code: number; message: string };
      expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(err.message).toContain('500');
    });

    it('should throw when no credentials exist', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      const result = await outcome(service.revokeToken());
      expect(result.error).toBeDefined();
    });

    it('should propagate fetch network errors', async () => {
      const configService = createMockConfigService({
        authMethod: 'oauth',
        oauthAccessToken: 'token',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
      const service = new OAuthService(configService, configService);

      globalThis.fetch = (async () => {
        throw new Error('network down');
      }) as typeof fetch;

      const result = await outcome(service.revokeToken());
      expect(result.error).toBeDefined();
      expect((result.error as Error).message).toContain('network down');
    });
  });

  describe('authorize (full OAuth flow)', () => {
    function tokenResponse(
      overrides: Partial<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }> = {}
    ): FetchResponse {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'auth-access-token',
          refresh_token: 'auth-refresh-token',
          expires_in: 7200,
          token_type: 'bearer',
          scopes: 'account repository',
          ...overrides,
        }),
      };
    }

    function userResponse(
      overrides: Partial<{
        username: string;
        display_name: string;
        account_id: string;
      }> = {}
    ): FetchResponse {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          username: 'pilot',
          display_name: 'Pilot User',
          account_id: 'acc-123',
          ...overrides,
        }),
      };
    }

    it('should complete the authorization flow and store credentials', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      const fetchMock = mockFetch([tokenResponse(), userResponse()]);

      const authorizePromise = service.authorize();

      const authUrl = await waitForBrowserOpen();
      expect(authUrl).toContain('https://bitbucket.org/site/oauth2/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=');

      const state = extractState(authUrl);
      // OAuth state must be at least 256 bits (64 hex chars).
      expect(state).toMatch(/^[0-9a-f]{64}$/);

      const callbackResponse = await originalFetch(
        `${CALLBACK_URL}?code=the-code&state=${state}`
      );
      expect(callbackResponse.status).toBe(200);
      const body = await callbackResponse.text();
      expect(body).toContain('Authenticated');

      const userInfo = await authorizePromise;
      expect(userInfo).toEqual({
        username: 'pilot',
        displayName: 'Pilot User',
        accountId: 'acc-123',
      });

      // Verify token exchange used the authorization code
      const tokenCall = fetchMock.getCalls()[0];
      expect(tokenCall.url).toContain('oauth2/access_token');
      expect(tokenCall.options.method).toBe('POST');
      const tokenBody = tokenCall.options.body as string;
      expect(tokenBody).toContain('grant_type=authorization_code');
      expect(tokenBody).toContain('code=the-code');
      expect(tokenBody).toContain(
        `redirect_uri=${encodeURIComponent(CALLBACK_URL)}`
      );

      // Verify user info was fetched with Bearer token
      const userCall = fetchMock.getCalls()[1];
      expect(userCall.url).toBe('https://api.bitbucket.org/2.0/user');
      const authHeader = (userCall.options.headers as Record<string, string>)[
        'Authorization'
      ];
      expect(authHeader).toBe('Bearer auth-access-token');

      // Verify credentials were persisted
      const creds = await configService.getOAuthCredentials();
      expect(creds.accessToken).toBe('auth-access-token');
      expect(creds.refreshToken).toBe('auth-refresh-token');
      expect(creds.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should persist custom client id and secret when provided', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([tokenResponse(), userResponse()]);

      const authorizePromise = service.authorize(
        'custom-client-id',
        'custom-client-secret'
      );

      const authUrl = await waitForBrowserOpen();
      expect(authUrl).toContain('client_id=custom-client-id');
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);
      await authorizePromise;

      expect(await configService.getValue('oauthClientId')).toBe(
        'custom-client-id'
      );
      expect(await configService.getValue('oauthClientSecret')).toBe(
        'custom-client-secret'
      );
    });

    it('should use the stored custom client id when no override is given', async () => {
      const configService = createMockConfigService({
        oauthClientId: 'stored-client-id',
      });
      const service = new OAuthService(configService, configService);

      mockFetch([tokenResponse(), userResponse()]);

      const authorizePromise = service.authorize();
      const authUrl = await waitForBrowserOpen();
      expect(authUrl).toContain('client_id=stored-client-id');
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);
      await authorizePromise;
    });

    it('should reject with AUTH_INVALID when the callback returns error=access_denied', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      // No fetch mocks needed — authorize should reject before exchangeCode
      mockFetch([]);

      const authorizeOutcome = outcome(service.authorize());
      await waitForBrowserOpen();

      const resp = await originalFetch(
        `${CALLBACK_URL}?error=access_denied&error_description=User+declined`
      );
      expect(resp.status).toBe(200);
      const body = await resp.text();
      expect(body).toContain('Authentication Failed');
      expect(body).toContain('User declined');

      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
      const err = result.error as { code: number; message: string };
      expect(err.code).toBe(ErrorCode.AUTH_INVALID);
      expect(err.message).toContain('User declined');
      expect(err.message).toContain('--app-password');
    });

    it('should reject with AUTH_INVALID when state does not match', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([]);

      const authorizeOutcome = outcome(service.authorize());
      await waitForBrowserOpen();

      const resp = await originalFetch(
        `${CALLBACK_URL}?code=c&state=wrong-state`
      );
      expect(resp.status).toBe(400);

      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
      const err = result.error as { code: number; message: string };
      expect(err.code).toBe(ErrorCode.AUTH_INVALID);
      expect(err.message).toContain('Invalid authorization callback');
    });

    it('should reject when the callback has no code and no error', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([]);

      const authorizeOutcome = outcome(service.authorize());
      const authUrl = await waitForBrowserOpen();
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?state=${state}`);

      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
      expect((result.error as { code: number }).code).toBe(
        ErrorCode.AUTH_INVALID
      );
    });

    it('should return 404 for requests to paths other than /callback', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([tokenResponse(), userResponse()]);

      const authorizePromise = service.authorize();
      const authUrl = await waitForBrowserOpen();
      const state = extractState(authUrl);

      // Unknown path should return 404 and not complete the flow
      const bogus = await originalFetch(
        `http://localhost:${CALLBACK_PORT}/nope`
      );
      expect(bogus.status).toBe(404);

      // Hit the real callback to resolve the outer promise.
      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);
      await authorizePromise;
    });

    it('should reject with AUTH_INVALID when token exchange fails', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([
        {
          ok: false,
          status: 400,
          text: async () => 'invalid_grant',
        },
      ]);

      const authorizeOutcome = outcome(service.authorize());
      const authUrl = await waitForBrowserOpen();
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);

      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
      const err = result.error as {
        code: number;
        message: string;
        context: Record<string, unknown>;
      };
      expect(err.code).toBe(ErrorCode.AUTH_INVALID);
      expect(err.message).toContain('Failed to exchange authorization code');
      expect(err.context).toEqual({ status: 400, body: 'invalid_grant' });
    });

    it('should reject with AUTH_INVALID when user info fetch fails', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([
        tokenResponse(),
        { ok: false, status: 401, text: async () => 'unauthorized' },
      ]);

      const authorizeOutcome = outcome(service.authorize());
      const authUrl = await waitForBrowserOpen();
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);

      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
      const err = result.error as { code: number; message: string };
      expect(err.code).toBe(ErrorCode.AUTH_INVALID);
      expect(err.message).toContain('verify OAuth credentials');
    });

    it('should HTML-escape the error description in the callback page', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      mockFetch([]);

      const authorizeOutcome = outcome(service.authorize());
      await waitForBrowserOpen();

      const resp = await originalFetch(
        `${CALLBACK_URL}?error=denied&error_description=${encodeURIComponent(
          '<script>alert(1)</script>'
        )}`
      );
      const body = await resp.text();
      expect(body).not.toContain('<script>alert(1)</script>');
      expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

      // Flow rejects; we only care about the HTML content here.
      const result = await authorizeOutcome;
      expect(result.error).toBeDefined();
    });

    it('should reject when the callback port is already in use', async () => {
      // Start a blocking server on the OAuth callback port first.
      const blocker: Server = createServer((_, res) => {
        res.end();
      });

      await new Promise<void>((resolve, reject) => {
        blocker.once('error', reject);
        // Match the loopback bind the OAuth service now uses; binding to a
        // different interface would leave the port available on 127.0.0.1.
        blocker.listen(CALLBACK_PORT, '127.0.0.1', () => resolve());
      });

      try {
        const configService = createMockConfigService({});
        const service = new OAuthService(configService, configService);

        mockFetch([]);

        const result = await outcome(service.authorize());
        expect(result.error).toBeDefined();
        const err = result.error as { code: number; message: string };
        expect(err.code).toBe(ErrorCode.AUTH_INVALID);
        expect(err.message).toContain('already in use');
      } finally {
        await new Promise<void>((resolve) => blocker.close(() => resolve()));
      }
    });

    it('should continue when the browser fails to open', async () => {
      const configService = createMockConfigService({});
      const service = new OAuthService(configService, configService);

      // Swap open() to throw for this test only.
      const originalImplementation = openMock.getMockImplementation();
      openMock.mockImplementation(async () => {
        throw new Error('no browser available');
      });

      try {
        mockFetch([tokenResponse(), userResponse()]);

        const authorizePromise = service.authorize();
        // openMock still records the attempt even when it throws.
        const authUrl = await waitForBrowserOpen();
        const state = extractState(authUrl);

        await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);
        const result = await authorizePromise;
        expect(result.username).toBe('pilot');

        // Console error should show the manual fallback URL.
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        if (originalImplementation) {
          openMock.mockImplementation(originalImplementation);
        } else {
          openMock.mockImplementation(async () => undefined);
        }
      }
    });

    it('should forward an override client secret to the token exchange', async () => {
      const configService = createMockConfigService({
        oauthClientSecret: 'stored-secret',
      });
      const service = new OAuthService(configService, configService);

      const fetchMock = mockFetch([tokenResponse(), userResponse()]);

      const authorizePromise = service.authorize(
        'custom-id',
        'override-secret'
      );
      const authUrl = await waitForBrowserOpen();
      const state = extractState(authUrl);

      await originalFetch(`${CALLBACK_URL}?code=c&state=${state}`);
      await authorizePromise;

      // Token exchange should use the override secret, not the stored one.
      const tokenCall = fetchMock.getCalls()[0];
      const authHeader = (tokenCall.options.headers as Record<string, string>)[
        'Authorization'
      ];
      const decoded = Buffer.from(
        authHeader.replace('Basic ', ''),
        'base64'
      ).toString();
      expect(decoded).toBe('custom-id:override-secret');
    });
  });
});
