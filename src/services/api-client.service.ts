/**
 * API Client Service - Axios instance with auth and error handling
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  ICredentialStore,
  IOutputService,
} from '../core/interfaces/services.js';
import type { OAuthService } from './oauth.service.js';
import { BBError, ErrorCode, APIError } from '../types/errors.js';

const BASE_URL = 'https://api.bitbucket.org/2.0';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Default per-request timeout. A server that accepts a connection but never
 * responds would otherwise hang the CLI forever — fatal for CI/scripts where
 * there's no human to Ctrl-C. Overridable via `BB_HTTP_TIMEOUT` (milliseconds;
 * set to `0` to disable). */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Resolve the request timeout from `BB_HTTP_TIMEOUT` (milliseconds), falling
 * back to {@link DEFAULT_TIMEOUT_MS}. A value of `0` disables the timeout
 * (axios treats `0` as "no timeout"). Negative or non-numeric values are
 * ignored in favor of the default.
 */
function resolveTimeoutMs(): number {
  const raw = process.env.BB_HTTP_TIMEOUT;
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return parsed;
}

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

/**
 * Network-level error codes (no HTTP response received) considered transient
 * and worth retrying. Rationale per code:
 *
 * - ECONNRESET:   the peer (or an intermediary proxy/LB) dropped an
 *                 established socket mid-flight — classic transient blip.
 * - ETIMEDOUT:    OS-level connect/read timeout, or axios's own timeout when
 *                 `transitional.clarifyTimeoutError` is enabled.
 * - ECONNABORTED: axios's default code for its own request timeout; a slow or
 *                 momentarily overloaded server may answer on a fresh attempt.
 * - EAI_AGAIN:    DNS resolver returned a *temporary* failure — by definition
 *                 retryable (transient resolver/upstream hiccup).
 * - EPIPE:        write on a socket the peer already closed (e.g. keep-alive
 *                 connection reaped by a proxy); a new connection usually works.
 *
 * Deliberately excluded as (almost always) permanent until the user fixes
 * something:
 * - ENOTFOUND:    DNS says the host does not exist — misconfiguration/offline,
 *                 not a blip; retrying just delays the actionable error.
 * - ECONNREFUSED: the host actively rejected the connection (service down,
 *                 wrong port, proxy misconfig) — unlikely to recover within
 *                 our seconds-scale backoff window.
 * - CERT/TLS errors (e.g. UNABLE_TO_VERIFY_LEAF_SIGNATURE): configuration
 *                 problems, never transient.
 */
const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNABORTED',
  'EAI_AGAIN',
  'EPIPE',
]);

/**
 * Methods safe to retry after a network failure where we cannot know whether
 * the server processed the request (the socket died before any response).
 * Only RFC 9110 "safe" methods qualify: replaying them can never duplicate a
 * side effect. Bitbucket's PUT/DELETE endpoints are *semantically* idempotent,
 * but we stay conservative and exclude them: some trigger side effects beyond
 * the resource itself (webhooks, notifications, pipeline runs), and a replay
 * after partial server-side processing can surface confusing secondary errors
 * (e.g. 404 on a DELETE that actually succeeded). Non-idempotent methods
 * (POST/PATCH) keep the existing fail-fast behavior.
 */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const SENSITIVE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'token',
  'id_token',
  'client_secret',
  'password',
  'authorization',
]);

const REDACTED = '[REDACTED]';

function redactSensitive(
  value: unknown,
  seen = new WeakSet<object>()
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value as object)) {
    return '[Circular]';
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED;
    } else {
      result[key] = redactSensitive(val, seen);
    }
  }
  return result;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __tokenRefreshed?: boolean;
}

function getRetryDelay(error: AxiosError, attempt: number): number {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      const seconds = Number.parseInt(retryAfter, 10);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactRequestUrl(
  requestUrl: string | undefined,
  baseUrl: string | undefined
): string {
  const raw = requestUrl ?? '';
  try {
    const parsed = new URL(raw, baseUrl);
    const query = parsed.search ? '?[redacted]' : '';
    return `${parsed.origin}${parsed.pathname}${query}`;
  } catch {
    const queryIdx = raw.indexOf('?');
    return queryIdx === -1 ? raw : `${raw.slice(0, queryIdx)}?[redacted]`;
  }
}

// DEBUG=true logs (`[HTTP] ...`) intentionally use raw `console.debug` rather
// than `IOutputService` because they are an opt-in developer-troubleshooting
// channel: they bypass the user-facing output format (including --json) so the
// payload remains readable when piped, and they should be visible regardless of
// any future output-suppression flags. See issue #223 for the full discussion.
export function createApiClient(
  credentialStore: ICredentialStore,
  output: IOutputService,
  oauthService?: OAuthService
): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: resolveTimeoutMs(),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor to add auth header (Basic or Bearer)
  instance.interceptors.request.use(
    async (config) => {
      if (process.env.DEBUG === 'true') {
        console.debug(
          `[HTTP] ${config.method?.toUpperCase()} ${redactRequestUrl(config.url, config.baseURL)}`
        );
      }

      const authMethod = await credentialStore.getAuthMethod();

      if (authMethod === 'oauth' && oauthService) {
        // Proactive refresh: get a valid token (refreshes if expired)
        const accessToken = await oauthService.getValidAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        const credentials = await credentialStore.getCredentials();
        const authString = Buffer.from(
          `${credentials.username}:${credentials.apiToken}`
        ).toString('base64');
        config.headers.Authorization = `Basic ${authString}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor with retry logic and error transformation
  instance.interceptors.response.use(
    (response) => {
      if (process.env.DEBUG === 'true') {
        console.debug(`[HTTP] Response: ${response.status}`);
        console.debug(
          `[HTTP] Response Body:`,
          JSON.stringify(redactSensitive(response.data), null, 2)
        );
      }
      return response;
    },
    async (error: AxiosError) => {
      if (process.env.DEBUG === 'true') {
        console.debug(`[HTTP] Error:`, error.message);
        if (error.response) {
          console.debug(
            `[HTTP] Error Response Body:`,
            JSON.stringify(redactSensitive(error.response.data), null, 2)
          );
        }
      }

      // Reactive OAuth token refresh on 401
      if (error.response?.status === 401 && oauthService) {
        const config = error.config as RetryableConfig | undefined;
        if (config && !config.__tokenRefreshed) {
          const authMethod = await credentialStore.getAuthMethod();
          if (authMethod === 'oauth') {
            try {
              config.__tokenRefreshed = true;
              const newToken = await oauthService.refreshAccessToken();
              config.headers.Authorization = `Bearer ${newToken}`;
              return instance(config);
            } catch {
              throw new BBError({
                code: ErrorCode.AUTH_EXPIRED,
                message: `OAuth token expired. Run 'bb auth login' to re-authenticate.`,
              });
            }
          }
        }
      }

      // Retry on transient/rate-limit errors
      if (error.response && RETRYABLE_STATUS_CODES.has(error.response.status)) {
        const config = error.config as RetryableConfig | undefined;
        if (config) {
          const retryCount = config.__retryCount ?? 0;
          if (retryCount < MAX_RETRIES) {
            config.__retryCount = retryCount + 1;
            const delay = getRetryDelay(error, config.__retryCount);
            const status = error.response.status;
            const label =
              status === 429 ? 'Rate limited' : `Server error (${status})`;
            // Suppress retry chatter in --json mode so it doesn't pollute the
            // structured pipeline reading from this process. Outside JSON mode,
            // route through `output.warning()` for the standard ⚠ prefix and
            // --no-color handling.
            if (!output.isJsonMode()) {
              output.warning(
                `${label}, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${config.__retryCount}/${MAX_RETRIES})...`
              );
            }
            await sleep(delay);
            return instance(config);
          }
        }
      }

      // Retry transient network errors (request sent, no response received:
      // dropped sockets, DNS hiccups, timeouts) — but only for idempotent
      // methods, since without a response we cannot tell whether the server
      // already processed the request. Shares __retryCount with the
      // status-code path above so combined attempts stay bounded by
      // MAX_RETRIES, and uses the same exponential backoff (no response means
      // getRetryDelay never sees a Retry-After header).
      if (
        !error.response &&
        error.request &&
        error.code !== undefined &&
        RETRYABLE_NETWORK_CODES.has(error.code)
      ) {
        const config = error.config as RetryableConfig | undefined;
        const method = config?.method?.toUpperCase() ?? '';
        if (config && IDEMPOTENT_METHODS.has(method)) {
          const retryCount = config.__retryCount ?? 0;
          if (retryCount < MAX_RETRIES) {
            config.__retryCount = retryCount + 1;
            const delay = getRetryDelay(error, config.__retryCount);
            // Same JSON-mode suppression rationale as the status-code path.
            if (!output.isJsonMode()) {
              output.warning(
                `Network error (${error.code}), retrying in ${(delay / 1000).toFixed(1)}s (attempt ${config.__retryCount}/${MAX_RETRIES})...`
              );
            }
            await sleep(delay);
            return instance(config);
          }
        }
      }

      // Transform non-retryable errors (or exhausted retries) into BBError
      if (error.response) {
        const { status, data } = error.response;
        const message = extractErrorMessage(data) || error.message;
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        throw new APIError(message, status, data, {
          status,
          ...(method ? { method } : {}),
          ...(url ? { url } : {}),
        });
      } else if (error.request) {
        // Axios reports request timeouts with `code` 'ECONNABORTED' (default)
        // or 'ETIMEDOUT' (when transitional.clarifyTimeoutError is enabled) and
        // no `response`, so they land here. Detect via `code` rather than the
        // overridable/localized `error.message`.
        const isTimeout =
          error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
        throw new BBError({
          code: ErrorCode.NETWORK_ERROR,
          message: isTimeout
            ? `Network error: Request to Bitbucket API timed out after ${instance.defaults.timeout}ms. The server accepted the connection but did not respond in time. Increase or disable the timeout via BB_HTTP_TIMEOUT (milliseconds; set BB_HTTP_TIMEOUT=0 to disable), or run with DEBUG=true for details.`
            : "Network error: Unable to reach Bitbucket API. Run with DEBUG=true for details. If you're behind a proxy or using a custom CA, check your environment.",
          cause: error,
        });
      } else {
        throw new BBError({
          code: ErrorCode.UNKNOWN,
          message: error.message || 'Unknown error occurred',
          cause: error,
        });
      }
    }
  );

  return instance;
}

/**
 * Flatten Bitbucket's `error.fields` map into `key: reason` pairs. Bitbucket
 * pairs a terse message like "Bad request" with this map, and it is the only
 * part that says which key was rejected.
 */
function formatErrorFields(fields: unknown): string | undefined {
  if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) {
    return undefined;
  }

  const parts = Object.entries(fields as Record<string, unknown>).flatMap(
    ([key, reason]) => {
      const text = Array.isArray(reason)
        ? reason.filter((item) => typeof item === 'string').join(', ')
        : typeof reason === 'string'
          ? reason
          : '';
      return text ? [`${key}: ${text}`] : [];
    }
  );

  return parts.length > 0 ? parts.join('; ') : undefined;
}

function extractErrorMessage(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    const errorObj = data as Record<string, unknown>;
    if (typeof errorObj.error === 'object' && errorObj.error !== null) {
      const errorDetail = errorObj.error as Record<string, unknown>;
      if (typeof errorDetail.message === 'string') {
        const fields = formatErrorFields(errorDetail.fields);
        return fields
          ? `${errorDetail.message} (${fields})`
          : errorDetail.message;
      }
    }
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  return undefined;
}
