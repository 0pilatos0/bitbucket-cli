/**
 * Leveled HTTP debug tracing for the shared API client.
 *
 * `BB_DEBUG=http` logs one line per request and one per outcome (status or
 * network error code, plus elapsed milliseconds); `BB_DEBUG=verbose` adds the
 * redacted response bodies. `DEBUG=true` is kept as an alias for `verbose`,
 * which is what it always printed.
 *
 * Every line carries a short correlation id so overlapping requests stay
 * matchable. The id lives on the axios config, so a retry or a 401 replay of
 * the same config keeps it and logs its attempt number instead.
 *
 * Lines go to raw `console.debug` rather than `IOutputService` on purpose:
 * this is an opt-in troubleshooting channel that must stay readable when
 * piped and must not be swallowed by `--json` or future output-suppression
 * flags.
 */

import { randomBytes } from 'node:crypto';
import { isAxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export type HttpDebugLevel = 'off' | 'http' | 'verbose';

/**
 * Resolve the trace level. A non-empty `BB_DEBUG` always wins, so any value
 * other than `http` or `verbose` (e.g. `off`) disables tracing even when
 * `DEBUG=true` is exported for some other tool. Matching is
 * case-insensitive and ignores surrounding whitespace.
 */
export function resolveHttpDebugLevel(): HttpDebugLevel {
  const raw = process.env.BB_DEBUG?.trim().toLowerCase();
  if (raw) {
    return raw === 'http' || raw === 'verbose' ? raw : 'off';
  }
  return process.env.DEBUG === 'true' ? 'verbose' : 'off';
}

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

/**
 * Recursively replace values under case-insensitive sensitive keys
 * (tokens, passwords, authorization headers) with `[REDACTED]` and break
 * circular references.
 */
export function redactSensitive(
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

/**
 * Strip a request URL down to `origin + pathname`, replacing any query
 * string with `?[redacted]` so tokens in query params never reach debug
 * output. Root-relative URLs (a leading `/`) are resolved against the base
 * so the base path survives and the log matches the actual wire URL. Falls
 * back to a manual query split when URL parsing fails.
 */
export function redactRequestUrl(
  requestUrl: string | undefined,
  baseUrl: string | undefined
): string {
  const raw = requestUrl ?? '';
  try {
    // axios concatenates baseURL + url for relative paths; mirror that so
    // the logged URL matches the actual wire request (base path preserved).
    // Absolute and protocol-relative URLs are used as-is.
    const full =
      raw.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)
        ? raw
        : `${(baseUrl ?? '').replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
    const parsed = new URL(full);
    const query = parsed.search ? '?[redacted]' : '';
    return `${parsed.origin}${parsed.pathname}${query}`;
  } catch {
    const queryIdx = raw.indexOf('?');
    return queryIdx === -1 ? raw : `${raw.slice(0, queryIdx)}?[redacted]`;
  }
}

export interface HttpDebugLogger {
  /** Call once per attempt, right before the request is dispatched. */
  request(config: InternalAxiosRequestConfig): void;
  response(response: AxiosResponse): void;
  error(error: unknown): void;
}

interface TracedConfig extends InternalAxiosRequestConfig {
  __traceId?: string;
  __traceAttempt?: number;
  __traceStartedAt?: number;
}

const NOOP_LOGGER: HttpDebugLogger = {
  request() {},
  response() {},
  error() {},
};

function newTraceId(): string {
  return randomBytes(3).toString('hex');
}

function describeRequest(config: TracedConfig): string {
  const method = config.method?.toUpperCase() ?? 'GET';
  return `${method} ${redactRequestUrl(config.url, config.baseURL)}`;
}

function formatBody(data: unknown): string {
  return JSON.stringify(redactSensitive(data), null, 2);
}

export function createHttpDebugLogger(
  level: HttpDebugLevel = resolveHttpDebugLevel(),
  now: () => number = () => performance.now()
): HttpDebugLogger {
  if (level === 'off') {
    return NOOP_LOGGER;
  }
  const verbose = level === 'verbose';

  const elapsed = (config: TracedConfig): string =>
    `${Math.round(now() - (config.__traceStartedAt ?? now()))}ms`;

  return {
    request(config) {
      const traced = config as TracedConfig;
      traced.__traceId ??= newTraceId();
      traced.__traceAttempt = (traced.__traceAttempt ?? 0) + 1;
      traced.__traceStartedAt = now();
      const attempt =
        traced.__traceAttempt > 1 ? ` (attempt ${traced.__traceAttempt})` : '';
      console.debug(
        `[HTTP] ${traced.__traceId} ${describeRequest(traced)}${attempt}`
      );
    },

    response(response) {
      const config = response.config as TracedConfig;
      const id = config.__traceId ?? '-';
      console.debug(
        `[HTTP] ${id} ${response.status} ${describeRequest(config)} ${elapsed(config)}`
      );
      if (verbose) {
        console.debug(`[HTTP] ${id} Response Body:`, formatBody(response.data));
      }
    },

    error(error) {
      const axiosError = isAxiosError(error) ? error : undefined;
      const config = axiosError?.config as TracedConfig | undefined;
      const message = error instanceof Error ? error.message : String(error);
      if (!config?.__traceId) {
        console.debug(`[HTTP] Error: ${message}`);
        return;
      }

      const id = config.__traceId;
      const line = `${describeRequest(config)} ${elapsed(config)}`;
      const response = axiosError?.response;
      if (!response) {
        const code = axiosError?.code ?? 'ERROR';
        console.debug(`[HTTP] ${id} ${code} ${line}: ${message}`);
        return;
      }
      console.debug(`[HTTP] ${id} ${response.status} ${line}`);
      if (verbose) {
        console.debug(
          `[HTTP] ${id} Error Response Body:`,
          formatBody(response.data)
        );
      }
    },
  };
}
