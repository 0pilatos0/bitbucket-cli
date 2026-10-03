/**
 * `--dry-run` support. While dry-run mode is on, the shared API client lets
 * read requests through (commands need them to build the write) and stops at
 * the first write request, which `BaseCommand.run()` then reports instead of
 * sending.
 */

import { REDACTED, isSensitiveKey, redactSensitive } from './http-debug.js';

export interface DryRunRequest {
  method: string;
  url: string;
  body?: unknown;
}

export class DryRunMode {
  private enabled = false;

  public enable(): void {
    this.enabled = true;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Thrown by the API client in place of a write request. Not a failure: the
 * command stops here and exits 0 after printing {@link request}.
 */
export class DryRunStop extends Error {
  constructor(public readonly request: DryRunRequest) {
    super(`Dry run: ${request.method} ${request.url} was not sent`);
    this.name = 'DryRunStop';
  }
}

/**
 * Render an outgoing request body for display: JSON strings are parsed,
 * multipart forms are listed by field (files by name and size, repeated
 * fields as arrays), and
 * credential-like keys are redacted the same way `BB_DEBUG=verbose` does.
 */
export function describeRequestBody(data: unknown): unknown {
  if (data === undefined || data === null || data === '') {
    return undefined;
  }
  if (typeof data === 'string') {
    try {
      return redactSensitive(JSON.parse(data));
    } catch {
      return data;
    }
  }
  if (data instanceof FormData) {
    const fields: Record<string, unknown> = {};
    // Bun types FormData entries as strings only; files arrive as `File`.
    for (const [key, value] of data.entries() as Iterable<[string, unknown]>) {
      const shown =
        value instanceof File
          ? `<file ${value.name}, ${value.size} bytes>`
          : value;
      const previous = fields[key];
      fields[key] =
        previous === undefined
          ? shown
          : [...(Array.isArray(previous) ? previous : [previous]), shown];
    }
    return redactSensitive(fields);
  }
  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    return `<${data.byteLength} bytes>`;
  }
  return redactSensitive(data);
}

/** Mask the values of credential-like query parameters (`?access_token=`). */
export function describeRequestUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const params = Array.from(parsed.searchParams);
  if (!params.some(([key]) => isSensitiveKey(key))) {
    return url;
  }
  const query = params
    .map(([key, value]) =>
      isSensitiveKey(key)
        ? `${encodeURIComponent(key)}=${REDACTED}`
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
  return `${parsed.origin}${parsed.pathname}?${query}`;
}
