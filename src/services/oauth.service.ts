/**
 * OAuth Service - Handles Bitbucket OAuth 2.0 Authorization Code flow
 */

import { createServer, type Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import type { IConfigService } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

const BITBUCKET_AUTHORIZE_URL =
  'https://bitbucket.org/site/oauth2/authorize';
const BITBUCKET_TOKEN_URL =
  'https://bitbucket.org/site/oauth2/access_token';

const CALLBACK_PORT = 19872;
const CALLBACK_PATH = '/callback';
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;
const AUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Default OAuth consumer credentials — users can override client ID with --client-id
const DEFAULT_CLIENT_ID = 'ErUBvNmdYtfVHgW6J4';
const DEFAULT_CLIENT_SECRET = 'QnrWypuKXv7YvU7WJwQRza2n2QfHCEw5';

const OAUTH_SCOPES = [
  'account',
  'repository',
  'repository:admin',
  'pullrequest',
  'pullrequest:write',
].join(' ');

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scopes: string;
}

function generateState(): string {
  return randomBytes(16).toString('hex');
}

export class OAuthService {
  constructor(private readonly configService: IConfigService) {}

  /**
   * Start the OAuth authorization flow: open browser, wait for callback, exchange code for tokens
   */
  public async authorize(clientId?: string, clientSecret?: string): Promise<{
    username: string;
    displayName: string;
    accountId: string;
  }> {
    const resolvedClientId = clientId ?? await this.getClientId();
    const state = generateState();

    const authUrl = this.buildAuthUrl(resolvedClientId, state);

    // Start local server before opening browser
    const { code } = await this.waitForCallback(authUrl, state);

    // Exchange authorization code for tokens
    const tokenResponse = await this.exchangeCode(code, resolvedClientId, clientSecret);

    // Store tokens
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
    await this.configService.setOAuthCredentials({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    });

    // Store custom OAuth consumer credentials if provided
    if (clientId) {
      await this.configService.setValue('oauthClientId', clientId);
    }
    if (clientSecret) {
      await this.configService.setValue('oauthClientSecret', clientSecret);
    }

    // Verify by fetching user info
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);
    return userInfo;
  }

  /**
   * Refresh the access token using the refresh token
   */
  public async refreshAccessToken(): Promise<string> {
    const credentials = await this.configService.getOAuthCredentials();
    const clientId = await this.getClientId();

    const clientSecret = await this.getClientSecret();
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
    });

    const response = await fetch(BITBUCKET_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BBError({
        code: ErrorCode.AUTH_EXPIRED,
        message: `Failed to refresh OAuth token. Run 'bb auth login' to re-authenticate.`,
        context: { status: response.status, body: errorBody },
      });
    }

    const tokenResponse = (await response.json()) as TokenResponse;
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

    await this.configService.setOAuthCredentials({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    });

    return tokenResponse.access_token;
  }

  /**
   * Revoke the current OAuth token
   */
  public async revokeToken(): Promise<void> {
    try {
      const credentials = await this.configService.getOAuthCredentials();
      const clientId = await this.getClientId();

      const clientSecret = await this.getClientSecret();
      const params = new URLSearchParams({
        token: credentials.accessToken,
      });

      await fetch('https://bitbucket.org/site/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: params.toString(),
      });
    } catch {
      // Best-effort revocation — don't fail logout if this errors
    }
  }

  /**
   * Get a valid access token, refreshing if needed
   */
  public async getValidAccessToken(): Promise<string> {
    const isExpired = await this.configService.isOAuthTokenExpired();
    if (isExpired) {
      return this.refreshAccessToken();
    }
    const credentials = await this.configService.getOAuthCredentials();
    return credentials.accessToken;
  }

  private async getClientId(): Promise<string> {
    const customClientId = await this.configService.getValue('oauthClientId');
    return customClientId ?? DEFAULT_CLIENT_ID;
  }

  private async getClientSecret(): Promise<string> {
    const customSecret = await this.configService.getValue('oauthClientSecret');
    return customSecret ?? DEFAULT_CLIENT_SECRET;
  }

  private buildAuthUrl(clientId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: CALLBACK_URL,
      scope: OAUTH_SCOPES,
      state,
    });
    return `${BITBUCKET_AUTHORIZE_URL}?${params.toString()}`;
  }

  private async waitForCallback(
    authUrl: string,
    expectedState: string
  ): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
      let server: Server;
      let timeout: ReturnType<typeof setTimeout>;

      const cleanup = () => {
        clearTimeout(timeout);
        server?.close();
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(
          new BBError({
            code: ErrorCode.AUTH_INVALID,
            message:
              'Authorization timed out. Please try again.',
          })
        );
      }, AUTH_TIMEOUT_MS);

      server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`);

        if (url.pathname !== CALLBACK_PATH) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(this.buildErrorPage(errorDescription ?? error));
          cleanup();
          reject(
            new BBError({
              code: ErrorCode.AUTH_INVALID,
              message: `Authorization was denied: ${errorDescription ?? error}. Run "bb auth login --app-password" to use an API token instead.`,
            })
          );
          return;
        }

        if (!code || state !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(this.buildErrorPage('Invalid callback parameters'));
          cleanup();
          reject(
            new BBError({
              code: ErrorCode.AUTH_INVALID,
              message: 'Invalid authorization callback. Please try again.',
            })
          );
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.buildSuccessPage());
        cleanup();
        resolve({ code });
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        cleanup();
        if (err.code === 'EADDRINUSE') {
          reject(
            new BBError({
              code: ErrorCode.AUTH_INVALID,
              message: `Port ${CALLBACK_PORT} is already in use. Close the application using it and try again.`,
            })
          );
        } else {
          reject(
            new BBError({
              code: ErrorCode.NETWORK_ERROR,
              message: `Failed to start callback server: ${err.message}`,
              cause: err,
            })
          );
        }
      });

      server.listen(CALLBACK_PORT, async () => {
        // Open browser
        try {
          const open = (await import('open')).default;
          await open(authUrl);
        } catch {
          // If browser can't be opened, user can copy the URL
        }
        console.error(
          `If the browser doesn't open, visit:\n${authUrl}\n`
        );
      });
    });
  }

  private async exchangeCode(
    code: string,
    clientId: string,
    clientSecretOverride?: string
  ): Promise<TokenResponse> {
    const clientSecret = clientSecretOverride ?? await this.getClientSecret();
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK_URL,
    });

    const response = await fetch(BITBUCKET_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: `Failed to exchange authorization code. Please try again.`,
        context: { status: response.status, body: errorBody },
      });
    }

    return (await response.json()) as TokenResponse;
  }

  private async fetchUserInfo(
    accessToken: string
  ): Promise<{ username: string; displayName: string; accountId: string }> {
    const response = await fetch('https://api.bitbucket.org/2.0/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: 'Failed to verify OAuth credentials.',
      });
    }

    const user = (await response.json()) as {
      username: string;
      display_name: string;
      account_id: string;
    };

    return {
      username: user.username,
      displayName: user.display_name,
      accountId: user.account_id,
    };
  }

  private buildSuccessPage(): string {
    return `<!DOCTYPE html>
<html><head><title>Bitbucket CLI</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}
.card{background:white;padding:2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);text-align:center;max-width:400px}
h1{color:#2ecc71;margin-bottom:0.5rem}p{color:#666}</style>
</head><body><div class="card"><h1>Authenticated!</h1>
<p>You can close this window and return to the terminal.</p></div></body></html>`;
  }

  private buildErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html><head><title>Bitbucket CLI</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}
.card{background:white;padding:2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);text-align:center;max-width:400px}
h1{color:#e74c3c;margin-bottom:0.5rem}p{color:#666}</style>
</head><body><div class="card"><h1>Authentication Failed</h1>
<p>${message}</p></div></body></html>`;
  }
}
