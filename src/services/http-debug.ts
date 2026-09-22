/**
 * Leveled HTTP debug tracing for the shared API client.
 *
 * `BB_DEBUG=http` logs one line per request and one per outcome (status or
 * network error code, plus elapsed milliseconds on the wire). Time spent
 * before the send (pacing, retry backoff, credential lookup) is reported
 * separately. `BB_DEBUG=verbose` adds the redacted request and response
 * bodies. `DEBUG=true` is kept as an alias for `verbose`, which is what it
 * always printed. The same level gates the CLI's other diagnostic lines
 * through `isDebugEnabled()`.
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

const OFF_VALUES = new Set(['0', 'false', 'off', 'no', 'none']);

/**
 * Resolve the trace level. A non-empty `BB_DEBUG` always wins over
 * `DEBUG=true`, so `BB_DEBUG=off` silences a `DEBUG` exported for another
 * tool. `verbose` selects bodies, an explicit off value (`0`, `false`, `off`,
 * `no`, `none`) disables tracing, and anything else (`1`, `true`, a typo)
 * means `http`, so a guessed value never silently prints nothing. Matching is
 * case-insensitive and ignores surrounding whitespace.
 */
export function resolveHttpDebugLevel(): HttpDebugLevel {
  const raw = process.env.BB_DEBUG?.trim().toLowerCase();
  if (raw) {
    if (raw === 'verbose') return 'verbose';
    return OFF_VALUES.has(raw) ? 'off' : 'http';
  }
  return process.env.DEBUG === 'true' ? 'verbose' : 'off';
}

export function isDebugEnabled(): boolean {
  return resolveHttpDebugLevel() !== 'off';
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
  /**
   * Call once per attempt, after pacing and before credentials are resolved,
   * so an auth failure still follows a request line. `queuedMs` is the time
   * the pacer held this attempt back.
   */
  request(config: InternalAxiosRequestConfig, queuedMs?: number): void;
  /** Call right before dispatch; the outcome's elapsed time starts here. */
  dispatch(config: InternalAxiosRequestConfig): void;
  response(response: AxiosResponse): void;
  error(error: unknown): void;
}

interface Trace {
  id: string;
  attempt: number;
  announcedAt: number;
  startedAt?: number;
  settledAt?: number;
}

interface TracedConfig extends InternalAxiosRequestConfig {
  __trace?: Trace;
}

const NOOP_LOGGER: HttpDebugLogger = {
  request() {},
  dispatch() {},
  response() {},
  error() {},
};

function newTraceId(): string {
  return randomBytes(3).toString('hex');
}

function describeRequest(config: InternalAxiosRequestConfig): string {
  const method = config.method?.toUpperCase() ?? 'GET';
  return `${method} ${redactRequestUrl(config.url, config.baseURL)}`;
}

function formatBody(data: unknown): string {
  return JSON.stringify(redactSensitive(data), null, 2);
}

/** Raw `bb api --input` bodies are strings; parse them so redaction applies. */
function parseRequestBody(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function createHttpDebugLogger(
  level: HttpDebugLevel = resolveHttpDebugLevel(),
  now: () => number = () => performance.now()
): HttpDebugLogger {
  if (level === 'off') {
    return NOOP_LOGGER;
  }
  const verbose = level === 'verbose';

  const outcome = (
    config: TracedConfig,
    result: string | number,
    detail = ''
  ): string => {
    const trace = config.__trace;
    const prefix = trace ? `[HTTP] ${trace.id}` : '[HTTP]';
    let timing = '';
    if (trace?.startedAt !== undefined) {
      const settledAt = now();
      trace.settledAt = settledAt;
      const authMs = Math.round(trace.startedAt - trace.announcedAt);
      timing = ` ${Math.round(settledAt - trace.startedAt)}ms`;
      if (authMs > 0) {
        timing += ` (auth ${authMs}ms)`;
      }
    }
    console.debug(
      `${prefix} ${result} ${describeRequest(config)}${timing}${detail}`
    );
    return prefix;
  };

  const logBody = (prefix: string, label: string, data: unknown): void => {
    if (verbose) {
      console.debug(`${prefix} ${label}:`, formatBody(data));
    }
  };

  return {
    request(config, queuedMs = 0) {
      const traced = config as TracedConfig;
      const previous = traced.__trace;
      const announcedAt = now();
      const trace: Trace = {
        id: previous?.id ?? newTraceId(),
        attempt: (previous?.attempt ?? 0) + 1,
        announcedAt,
      };
      traced.__trace = trace;
      const waitedMs = Math.round(
        previous?.settledAt !== undefined
          ? announcedAt - previous.settledAt
          : queuedMs
      );
      const notes = [
        ...(trace.attempt > 1 ? [`attempt ${trace.attempt}`] : []),
        ...(waitedMs > 0 ? [`waited ${waitedMs}ms`] : []),
      ];
      const suffix = notes.length > 0 ? ` (${notes.join(', ')})` : '';
      const prefix = `[HTTP] ${trace.id}`;
      console.debug(`${prefix} ${describeRequest(config)}${suffix}`);
      if (config.data != null) {
        logBody(prefix, 'Request Body', parseRequestBody(config.data));
      }
    },

    dispatch(config) {
      const trace = (config as TracedConfig).__trace;
      if (trace) {
        trace.startedAt = now();
      }
    },

    response(response) {
      const prefix = outcome(response.config, response.status);
      logBody(prefix, 'Response Body', response.data);
    },

    error(error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isAxiosError(error) || !error.config) {
        console.debug(`[HTTP] Error: ${message}`);
        return;
      }
      const { config, response } = error;
      if (!response) {
        outcome(config, error.code ?? 'ERROR', `: ${message}`);
        return;
      }
      const prefix = outcome(config, response.status);
      logBody(prefix, 'Error Response Body', response.data);
    },
  };
}
