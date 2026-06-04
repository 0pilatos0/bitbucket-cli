/**
 * Pure helpers for the `bb api` raw passthrough command. Kept HTTP-free so the
 * method resolution, field parsing, query/body distribution, placeholder
 * substitution, endpoint host validation, and pagination accessors can be unit
 * tested without an axios instance. The command in
 * `src/commands/api.command.ts` wires these to the authenticated axios stack.
 */

import { BBError, ErrorCode } from '../types/errors.js';

export const API_HOST = 'api.bitbucket.org';
export const API_BASE_URL = 'https://api.bitbucket.org/2.0';

export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

/**
 * Whether `token` names an HTTP verb (case-insensitive). Used by the CLI to
 * decide whether a leading positional is a method or the endpoint, so both
 * `bb api GET /user` and `bb api /user` parse correctly.
 */
export function isHttpMethod(token: string): boolean {
  return (HTTP_METHODS as readonly string[]).includes(token.toUpperCase());
}

/**
 * Normalize a method string to a canonical `HttpMethod`, or `undefined` when it
 * is not a supported verb.
 */
export function normalizeMethod(value: string): HttpMethod | undefined {
  const upper = value.toUpperCase();
  return (HTTP_METHODS as readonly string[]).includes(upper)
    ? (upper as HttpMethod)
    : undefined;
}

/**
 * Resolve the effective HTTP method. Precedence mirrors `gh api`:
 * explicit `-X/--method` > leading positional verb > inferred (`POST` when any
 * field/body is present, otherwise `GET`).
 */
export function resolveMethod(opts: {
  explicit?: string;
  positional?: string;
  hasParams: boolean;
}): HttpMethod {
  if (opts.explicit !== undefined) {
    const method = normalizeMethod(opts.explicit);
    if (!method) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `--method must be one of: ${HTTP_METHODS.join(', ')}`,
        context: { method: opts.explicit },
      });
    }
    return method;
  }

  if (opts.positional !== undefined) {
    const method = normalizeMethod(opts.positional);
    if (method) {
      return method;
    }
  }

  return opts.hasParams ? 'POST' : 'GET';
}

/**
 * Split a `key=value` assignment used by `-f`/`-F`. Throws on a missing `=`.
 */
export function parseFieldAssignment(raw: string): {
  key: string;
  rawValue: string;
} {
  const idx = raw.indexOf('=');
  if (idx <= 0) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: `Invalid field '${raw}'. Expected key=value.`,
      context: { field: raw },
    });
  }
  return { key: raw.slice(0, idx), rawValue: raw.slice(idx + 1) };
}

/**
 * Apply `gh`-style magic typing to a typed-field (`-F`) value: `true`/`false`/
 * `null` become their literals, integer/float strings become numbers, and
 * everything else stays a string. File (`@file`) and stdin values are resolved
 * by the command before reaching here and are passed through unchanged.
 */
export function magicType(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    // Guard against precision loss on very large integers: if the round-trip
    // doesn't match, keep the original string rather than a lossy number.
    if (String(parsed) === value) {
      return parsed;
    }
  }
  if (/^-?\d*\.\d+$/.test(value)) {
    return Number.parseFloat(value);
  }
  return value;
}

export interface FieldEntry {
  key: string;
  value: unknown;
}

/**
 * Assemble field entries into an object. Repeated keys collapse into an array,
 * matching `gh`'s behavior for multiple `-f`/`-F` with the same name.
 */
export function buildFieldObject(
  entries: readonly FieldEntry[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

function stringifyScalar(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  return String(value);
}

/**
 * Serialize a field object into a `key=value&key=value` query string, repeating
 * the key for array values and percent-encoding both sides.
 */
export function serializeQueryParams(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(stringifyScalar(item))}`
      );
    }
  }
  return parts.join('&');
}

/**
 * Decide where assembled fields / a raw body belong on the request. For GET and
 * HEAD, fields become a query string; for other methods they become a JSON
 * body. A raw `--input` body always wins (callers reject combining it with
 * fields beforehand).
 */
export function buildRequestParts(input: {
  method: HttpMethod;
  fields: Record<string, unknown>;
  rawBody?: string;
}): { query?: string; data?: unknown } {
  if (input.rawBody !== undefined) {
    return { data: input.rawBody };
  }

  const keys = Object.keys(input.fields);
  if (keys.length === 0) {
    return {};
  }

  const isGetLike = input.method === 'GET' || input.method === 'HEAD';
  if (isGetLike) {
    return { query: serializeQueryParams(input.fields) };
  }
  return { data: input.fields };
}

export interface EndpointPlaceholders {
  workspace: boolean;
  repo: boolean;
}

/**
 * Report which of `{workspace}` / `{repo}` appear in the endpoint, so the
 * command only resolves repository context when it is actually needed.
 */
export function findPlaceholders(endpoint: string): EndpointPlaceholders {
  return {
    workspace: endpoint.includes('{workspace}'),
    repo: endpoint.includes('{repo}'),
  };
}

/**
 * Substitute `{workspace}` and `{repo}` placeholders. Throws if a placeholder is
 * present but no value was resolved.
 */
export function substitutePlaceholders(
  endpoint: string,
  values: { workspace?: string; repo?: string }
): string {
  let result = endpoint;
  if (result.includes('{workspace}')) {
    if (!values.workspace) {
      throw new BBError({
        code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
        message:
          'Endpoint uses {workspace} but no workspace could be resolved. Pass --workspace or run inside a Bitbucket repo.',
      });
    }
    result = result.replaceAll('{workspace}', values.workspace);
  }
  if (result.includes('{repo}')) {
    if (!values.repo) {
      throw new BBError({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        message:
          'Endpoint uses {repo} but no repository could be resolved. Pass --repo or run inside a Bitbucket repo.',
      });
    }
    result = result.replaceAll('{repo}', values.repo);
  }
  return result;
}

/**
 * Normalize a user-supplied endpoint into a request URL for the authenticated
 * axios instance (whose baseURL is {@link API_BASE_URL}).
 *
 * - Absolute URLs are allowed ONLY for the Bitbucket API host. This is a
 *   security boundary: the request interceptor attaches the user's Bitbucket
 *   token to every call, so an arbitrary absolute URL would leak credentials to
 *   a foreign host.
 * - Relative paths get a leading slash; a redundant leading `2.0/` (the API
 *   version already in the baseURL) is stripped so `/2.0/user` and `/user`
 *   behave identically.
 */
export function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (trimmed === '') {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: 'An endpoint path is required (e.g. /user).',
    });
  }

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `Invalid URL: ${trimmed}`,
      });
    }
    if (url.host !== API_HOST) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `bb api only supports the Bitbucket API host (${API_HOST}); refusing to send credentials to ${url.host}.`,
        context: { host: url.host },
      });
    }
    return trimmed;
  }

  let path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  path = path.replace(/^\/2\.0(?=\/|$)/, '');
  return path === '' ? '/' : path;
}

/**
 * Pull the cursor `next` URL from a Bitbucket paginated payload, if present.
 */
export function getNextUrl(page: unknown): string | undefined {
  if (page && typeof page === 'object' && !Array.isArray(page)) {
    const next = (page as Record<string, unknown>).next;
    if (typeof next === 'string' && next.length > 0) {
      return next;
    }
  }
  return undefined;
}

/**
 * Pull the `values` array from a Bitbucket paginated payload, if present.
 */
export function getValues(page: unknown): unknown[] | undefined {
  if (page && typeof page === 'object' && !Array.isArray(page)) {
    const values = (page as Record<string, unknown>).values;
    if (Array.isArray(values)) {
      return values;
    }
  }
  return undefined;
}

/**
 * Split a raw `Name: value` header. Throws on a missing colon.
 */
export function parseHeader(raw: string): { name: string; value: string } {
  const idx = raw.indexOf(':');
  if (idx <= 0) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: `Invalid header '${raw}'. Expected 'Name: value'.`,
      context: { header: raw },
    });
  }
  return { name: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() };
}

/**
 * Parse repeated `-H` values into a header object. Later duplicates win.
 */
export function parseHeaders(raws: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const raw of raws) {
    const { name, value } = parseHeader(raw);
    headers[name] = value;
  }
  return headers;
}
