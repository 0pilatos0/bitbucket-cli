/**
 * OAuth Service - Handles Bitbucket OAuth 2.0 Authorization Code flow
 */

import { createServer, type Server } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import type {
  IConfigService,
  ICredentialStore,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

const BITBUCKET_AUTHORIZE_URL = 'https://bitbucket.org/site/oauth2/authorize';
const BITBUCKET_TOKEN_URL = 'https://bitbucket.org/site/oauth2/access_token';

const CALLBACK_HOST = '127.0.0.1';
const CALLBACK_PORT = 19872;
const CALLBACK_PATH = '/callback';
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;
const AUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 10_000;

// Default OAuth consumer credentials for the CLI. These ship with every copy
// of the binary and are NOT secret — this is the standard pattern for public
// OAuth clients (CLIs, native apps) where there is no trusted server to hold a
// secret. User authentication still happens through the authorization-code
// redirect flow below, so possession of the client secret alone grants nothing.
// Do not rotate these thinking they are leaked; users can override via
// --client-id / --client-secret on `bb auth login`.
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
  return randomBytes(32).toString('hex');
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(
    createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge };
}

const OAUTH_ERROR_DESCRIPTION_MAX_LENGTH = 200;

/**
 * Extract a sanitized `error_description` from an OAuth token-endpoint error
 * body. Returns undefined if the body isn't a JSON object with a string
 * `error_description`. The result is trimmed to a single line and capped in
 * length so attacker-influenced responses can't bloat the user-facing message.
 */
function extractOAuthErrorDescription(body: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('error_description' in parsed)
  ) {
    return undefined;
  }
  const description = (parsed as { error_description: unknown })
    .error_description;
  if (typeof description !== 'string') {
    return undefined;
  }
  const sanitized = description.replace(/\s+/g, ' ').trim();
  if (sanitized.length === 0) {
    return undefined;
  }
  return sanitized.length > OAUTH_ERROR_DESCRIPTION_MAX_LENGTH
    ? `${sanitized.slice(0, OAUTH_ERROR_DESCRIPTION_MAX_LENGTH)}…`
    : sanitized;
}

export class OAuthService {
  /**
   * In-flight refresh lock. Bitbucket ROTATES the refresh_token on every
   * refresh, so two concurrent POSTs to the token endpoint race: the trailing
   * one sends an already-invalidated refresh_token, fails, and silently logs
   * the user out. While a refresh is running, every caller — both the
   * proactive path ({@link getValidAccessToken}) and the reactive 401 path in
   * the api-client interceptor — awaits this same promise instead of starting
   * a second POST. Cleared on settle (success or failure) so a later expiry
   * can refresh again.
   */
  private refreshInFlight: Promise<string> | null = null;

  constructor(
    private readonly configService: IConfigService,
    private readonly credentialStore: ICredentialStore
  ) {}

  /**
   * Start the OAuth authorization flow: open browser, wait for callback, exchange code for tokens
   */
  public async authorize(
    clientId?: string,
    clientSecret?: string
  ): Promise<{
    username: string;
    displayName: string;
    accountId: string;
  }> {
    const resolvedClientId = clientId ?? (await this.getClientId());
    const state = generateState();
    const { verifier, challenge } = generatePkcePair();

    const authUrl = this.buildAuthUrl(resolvedClientId, state, challenge);

    // Start local server before opening browser
    const { code } = await this.waitForCallback(authUrl, state);

    // Exchange authorization code for tokens
    const tokenResponse = await this.exchangeCode(
      code,
      resolvedClientId,
      verifier,
      clientSecret
    );

    // Store tokens
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
    await this.credentialStore.setOAuthCredentials({
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
   * Refresh the access token using the refresh token.
   *
   * Concurrent calls are deduplicated: only the first starts a POST to the
   * token endpoint; the rest await the same promise and resolve to the same
   * new access token. A failed refresh clears the lock on settle so the next
   * call can retry with a fresh POST.
   */
  public refreshAccessToken(): Promise<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refresh = this.performTokenRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    this.refreshInFlight = refresh;
    return refresh;
  }

  private async performTokenRefresh(): Promise<string> {
    const credentials = await this.credentialStore.getOAuthCredentials();
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const description = extractOAuthErrorDescription(errorBody);
      const baseMessage = `Failed to refresh OAuth token. Run 'bb auth login' to re-authenticate.`;
      throw new BBError({
        code: ErrorCode.AUTH_EXPIRED,
        message: description ? `${baseMessage} (${description})` : baseMessage,
        context: { status: response.status },
      });
    }

    const tokenResponse = (await response.json()) as TokenResponse;
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

    await this.credentialStore.setOAuthCredentials({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    });

    return tokenResponse.access_token;
  }

  /**
   * Revoke the current OAuth token. Throws on failure so callers can surface
   * the issue to the user — a still-valid token at Bitbucket is a security
   * concern that should not be silently dropped.
   */
  public async revokeToken(): Promise<void> {
    const credentials = await this.credentialStore.getOAuthCredentials();
    const clientId = await this.getClientId();

    const clientSecret = await this.getClientSecret();
    const params = new URLSearchParams({
      token: credentials.accessToken,
    });

    const response = await fetch('https://bitbucket.org/site/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new BBError({
        code: ErrorCode.NETWORK_ERROR,
        message: `Failed to revoke OAuth token (HTTP ${response.status}).`,
        context: { status: response.status, body: errorBody },
      });
    }
  }

  /**
   * Get a valid access token, refreshing if needed
   */
  public async getValidAccessToken(): Promise<string> {
    const isExpired = await this.credentialStore.isOAuthTokenExpired();
    if (isExpired) {
      return this.refreshAccessToken();
    }
    const credentials = await this.credentialStore.getOAuthCredentials();
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

  private buildAuthUrl(
    clientId: string,
    state: string,
    codeChallenge: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: CALLBACK_URL,
      scope: OAUTH_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
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
            message: 'Authorization timed out. Please try again.',
          })
        );
      }, AUTH_TIMEOUT_MS);

      server = createServer((req, res) => {
        const url = new URL(
          req.url ?? '/',
          `http://localhost:${CALLBACK_PORT}`
        );

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

      server.listen(CALLBACK_PORT, CALLBACK_HOST, async () => {
        // Open browser
        try {
          const open = (await import('open')).default;
          await open(authUrl);
        } catch (err) {
          // The CLI keeps working — the user can copy the printed URL — but
          // tell DEBUG users why nothing opened.
          if (process.env.DEBUG === 'true') {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[oauth] could not open browser: ${message}`);
          }
        }
        console.error(`If the browser doesn't open, visit:\n${authUrl}\n`);
      });
    });
  }

  private async exchangeCode(
    code: string,
    clientId: string,
    codeVerifier: string,
    clientSecretOverride?: string
  ): Promise<TokenResponse> {
    const clientSecret = clientSecretOverride ?? (await this.getClientSecret());
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK_URL,
      code_verifier: codeVerifier,
    });

    const response = await fetch(BITBUCKET_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const description = extractOAuthErrorDescription(errorBody);
      const baseMessage = `Failed to exchange authorization code. Please try again.`;
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: description ? `${baseMessage} (${description})` : baseMessage,
        context: { status: response.status },
      });
    }

    return (await response.json()) as TokenResponse;
  }

  private async fetchUserInfo(
    accessToken: string
  ): Promise<{ username: string; displayName: string; accountId: string }> {
    const response = await fetch('https://api.bitbucket.org/2.0/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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

  private buildPageShell(content: string): string {
    return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bitbucket CLI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#181c24;
  --surface:#1e2330;
  --border:hsl(216,24%,27%);
  --text:#e0e4ec;
  --text-dim:#8892a4;
  --accent:hsl(216,100%,50%);
  --accent-glow:hsla(216,100%,52%,0.2);
  --accent-soft:hsla(216,100%,52%,0.09);
  --font:'Space Grotesk',sans-serif;
  --mono:'IBM Plex Mono',monospace;
}
body{
  font-family:var(--font);
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background-image:
    radial-gradient(ellipse 80% 60% at 50% 0%,var(--accent-glow),transparent),
    radial-gradient(circle at 100% 100%,var(--accent-soft),transparent 50%);
}
.scene{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:2rem;
  animation:enter 600ms cubic-bezier(.16,1,.3,1) both;
}
@keyframes enter{
  from{opacity:0;transform:translateY(16px) scale(.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.logo{
  width:56px;height:56px;
  background:var(--accent);
  border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-weight:700;font-size:24px;
  color:#fff;
  box-shadow:0 0 0 1px hsla(216,100%,70%,0.15),0 8px 32px hsla(216,100%,40%,0.25);
  animation:logo-in 700ms cubic-bezier(.16,1,.3,1) both;
  animation-delay:100ms;
}
@keyframes logo-in{
  from{opacity:0;transform:scale(.6) rotate(-8deg)}
  to{opacity:1;transform:scale(1) rotate(0)}
}
.card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  padding:2.5rem 3rem;
  text-align:center;
  max-width:420px;
  width:100%;
  box-shadow:0 1px 2px rgba(0,0,0,0.2),0 16px 48px rgba(0,0,0,0.15);
  animation:card-in 600ms cubic-bezier(.16,1,.3,1) both;
  animation-delay:200ms;
}
@keyframes card-in{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}
.icon-ring{
  width:52px;height:52px;
  border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 1.25rem;
  animation:ring-pop 500ms cubic-bezier(.16,1,.3,1) both;
  animation-delay:450ms;
}
@keyframes ring-pop{
  from{opacity:0;transform:scale(.5)}
  to{opacity:1;transform:scale(1)}
}
.icon-ring svg{width:28px;height:28px}
.icon-ring.success{background:hsla(152,68%,46%,0.12);color:hsl(152,68%,46%)}
.icon-ring.error{background:hsla(0,72%,56%,0.12);color:hsl(0,72%,56%)}
h1{
  font-size:1.35rem;font-weight:700;
  letter-spacing:-0.02em;
  margin-bottom:0.5rem;
  animation:text-in 500ms ease both;animation-delay:500ms;
}
.subtitle{
  font-size:0.9rem;color:var(--text-dim);
  line-height:1.5;
  animation:text-in 500ms ease both;animation-delay:580ms;
}
@keyframes text-in{
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}
.hint{
  font-family:var(--mono);font-size:0.72rem;
  color:var(--text-dim);letter-spacing:0.02em;
  opacity:0;animation:text-in 500ms ease forwards;animation-delay:700ms;
}
.hint a{
  color:var(--accent);text-decoration:none;
  text-underline-offset:0.2em;
}
.hint a:hover{text-decoration:underline}
.hint kbd{
  background:var(--surface);border:1px solid var(--border);
  border-radius:4px;padding:0.15em 0.45em;
  font-family:var(--mono);font-size:0.72rem;
}
</style>
</head><body>
<div class="scene">
  <div class="logo">bb</div>
  <div class="card">${content}</div>
</div>
</body></html>`;
  }

  private buildSuccessPage(): string {
    return this.buildPageShell(`
    <div class="icon-ring success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h1>Authenticated</h1>
    <p class="subtitle">You're all set. Close this tab and return to your terminal.</p>
    <p class="hint"><a href="https://bitbucket-cli.paulvanderlei.com" target="_blank" rel="noopener">View documentation</a></p>
`);
  }

  private buildErrorPage(message: string): string {
    const escaped = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return this.buildPageShell(`
    <div class="icon-ring error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
    <h1>Authentication Failed</h1>
    <p class="subtitle">${escaped}</p>
    <p class="hint"><a href="https://bitbucket-cli.paulvanderlei.com/help/troubleshooting/" target="_blank" rel="noopener">Troubleshooting guide</a></p>
`);
  }
}
