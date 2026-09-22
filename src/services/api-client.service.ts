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
import { RateLimiter } from './rate-limiter.js';
import { createHttpDebugLogger } from './http-debug.js';
import { BBError, ErrorCode, APIError } from '../types/errors.js';

const DEFAULT_BASE_URL = 'https://api.bitbucket.org/2.0';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Resolve the API base URL from `BB_API_BASE_URL` (e.g. a local gateway or
 * a mock server in integration tests), falling back to the Bitbucket Cloud
 * default. Trailing slashes are stripped so the generated client's
 * root-relative request paths keep their wire shape.
 */
export function resolveBaseUrl(): string {
  const raw = process.env.BB_API_BASE_URL;
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_BASE_URL;
  }
  return raw.trim().replace(/\/+$/, '');
}

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

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __tokenRefreshed?: boolean;
}

/**
 * Backoff delay for one retry attempt (1-based). A `Retry-After` header with
 * an integer-prefixed value (e.g. `5`, `5abc` parses as 5) on a 429 wins;
 * anything else — missing header, non-numeric start, HTTP-date format, or a
 * non-429 status — falls back to exponential backoff `1000 * 2^(attempt-1)`.
 * Exported for direct unit tests.
 */
export function getRetryDelay(error: AxiosError, attempt: number): number {
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

export function createApiClient(
  credentialStore: ICredentialStore,
  output: IOutputService,
  oauthService?: OAuthService,
  rateLimiter: RateLimiter = new RateLimiter()
): AxiosInstance {
  const httpDebug = createHttpDebugLogger();
  const instance = axios.create({
    baseURL: resolveBaseUrl(),
    timeout: resolveTimeoutMs(),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Strip `Content-Type` from bodyless requests (issue #321): the instance
  // default above is applied to every request, so bodyless POSTs (e.g.
  // `bb pr approve` / `bb pr decline`) go out declaring `application/json`
  // with a zero-length body, which Bitbucket's request parser rejects with a
  // bare-text 400 before the request reaches the endpoint. The default must
  // be stripped at the adapter level, after `dispatchRequest` has already run
  // (axios additionally injects `application/x-www-form-urlencoded` for
  // POST/PUT/PATCH when no Content-Type is set, which would replace anything
  // removed in a request interceptor). Request and `bb api` bodies are
  // unaffected: when `data` is present the header stays exactly as resolved.
  const stockAdapter = axios.getAdapter(instance.defaults.adapter);
  instance.defaults.adapter = async (config) => {
    if (config.data == null) {
      (config.headers as { delete(name: string): void }).delete('Content-Type');
    }
    return stockAdapter(config);
  };

  // Request interceptor to add auth header (Basic or Bearer)
  instance.interceptors.request.use(
    async (config) => {
      // Proactive pacing before anything else (issue #277): bulk runs stay
      // under the rate-limit ceiling instead of reacting to 429s afterwards.
      const queuedMs = await rateLimiter.acquire();
      httpDebug.request(config, queuedMs);

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

      httpDebug.dispatch(config);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor with retry logic and error transformation
  instance.interceptors.response.use(
    (response) => {
      rateLimiter.onResponse(response.headers);
      httpDebug.response(response);
      return response;
    },
    async (error: AxiosError) => {
      // Rate-limited responses carry the freshest budget information too:
      // pace subsequent requests from a 429's headers even though the
      // response is rejected (the success path handles normal responses).
      rateLimiter.onResponse(error.response?.headers);

      httpDebug.error(error);

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
        const { status, data, headers, statusText } = error.response;
        // Bitbucket's request parser rejects some malformed requests with a
        // bare plain-text body (e.g. `Bad Request`) that has no structured
        // `error.message`; surface that text instead of axios's generic
        // "Request failed with status code N" so the failure mode is legible.
        const message =
          extractErrorMessage(data) ?? errorBodySummary(data) ?? error.message;
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        const normalizedHeaders = normalizeResponseHeaders(headers);
        throw new APIError(
          message,
          status,
          data,
          {
            status,
            ...(method ? { method } : {}),
            ...(url ? { url } : {}),
          },
          {
            ...(normalizedHeaders ? { headers: normalizedHeaders } : {}),
            ...(typeof statusText === 'string' && statusText.trim() !== ''
              ? { statusText }
              : {}),
          }
        );
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
            ? `Network error: Request to Bitbucket API timed out after ${instance.defaults.timeout}ms. The server accepted the connection but did not respond in time. Increase or disable the timeout via BB_HTTP_TIMEOUT (milliseconds; set BB_HTTP_TIMEOUT=0 to disable), or run with BB_DEBUG=http for details.`
            : "Network error: Unable to reach Bitbucket API. Run with BB_DEBUG=http for details. If you're behind a proxy or using a custom CA, check your environment.",
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
 * part that says which key was rejected. Exported for direct unit tests.
 */
export function formatErrorFields(fields: unknown): string | undefined {
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

/**
 * Extract a human-readable message from a Bitbucket error response body:
 * the nested `error.message` (with formatted `error.fields` appended when
 * present), else a top-level string `message`. Exported for direct unit
 * tests.
 */
export function extractErrorMessage(data: unknown): string | undefined {
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

/** Maximum length of a raw-body fallback message before truncation. */
const ERROR_BODY_MESSAGE_MAX_LENGTH = 200;

/**
 * Summarize a non-JSON error body for use as an error message when
 * `extractErrorMessage()` finds no structured `error.message`/`message`.
 *
 * Bitbucket's request parser returns a bare plain-text body (e.g. `Bad
 * Request`) for some malformed requests, which previously fell through to
 * axios's generic "Request failed with status code N". Returning the body text
 * preserves the useful signal that the request never reached the endpoint.
 *
 * Only string bodies qualify: JSON objects/arrays are left to
 * `extractErrorMessage()` so we never stringify an arbitrary payload into the
 * `✗` line. Whitespace is collapsed and long bodies are truncated. Exported
 * for direct unit tests.
 */
export function errorBodySummary(data: unknown): string | undefined {
  if (typeof data !== 'string') {
    return undefined;
  }
  const collapsed = data.trim().replace(/\s+/g, ' ');
  if (collapsed === '') {
    return undefined;
  }
  return collapsed.length > ERROR_BODY_MESSAGE_MAX_LENGTH
    ? `${collapsed.slice(0, ERROR_BODY_MESSAGE_MAX_LENGTH - 3)}...`
    : collapsed;
}

/**
 * Normalize an axios response-headers object into a plain record. `AxiosHeaders`
 * exposes its values via `toJSON()` and own enumeration; a defensive copy keeps
 * the captured metadata independent of the live response object.
 */
function normalizeResponseHeaders(
  headers: unknown
): Record<string, unknown> | undefined {
  if (typeof headers !== 'object' || headers === null) {
    return undefined;
  }
  const candidate = headers as { toJSON?: () => unknown };
  if (typeof candidate.toJSON === 'function') {
    const json = candidate.toJSON();
    if (typeof json === 'object' && json !== null) {
      return { ...(json as Record<string, unknown>) };
    }
  }
  return { ...(headers as Record<string, unknown>) };
}
