/**
 * Direct unit tests for the api-client helper functions exported for the
 * interceptor suite (issue #265): redaction, URL scrubbing, retry delay, and
 * error-message extraction. Testing the pure functions directly is more
 * precise than observing them through the DEBUG console seam.
 */

import { describe, it, expect, afterEach } from 'bun:test';
import {
  extractErrorMessage,
  formatErrorFields,
  getRetryDelay,
  redactRequestUrl,
  redactSensitive,
  resolveBaseUrl,
} from '../../src/services/api-client.service.js';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

describe('redactSensitive', () => {
  it('replaces values under sensitive keys with [REDACTED] case-insensitively', () => {
    const result = redactSensitive({
      Access_Token: 'a',
      refresh_token: 'b',
      Authorization: 'c',
      client_secret: 'd',
      id: 1,
      name: 'keep',
    });
    expect(result).toEqual({
      Access_Token: '[REDACTED]',
      refresh_token: '[REDACTED]',
      Authorization: '[REDACTED]',
      client_secret: '[REDACTED]',
      id: 1,
      name: 'keep',
    });
  });

  it('redacts sensitive keys nested inside arrays and objects', () => {
    const result = redactSensitive({
      items: [
        { id: 1, token: 'nested' },
        { id: 2, password: 'also' },
      ],
      meta: { token: 'deep' },
    });
    expect(result).toEqual({
      items: [
        { id: 1, token: '[REDACTED]' },
        { id: 2, password: '[REDACTED]' },
      ],
      meta: { token: '[REDACTED]' },
    });
  });

  it('passes primitives and null through unchanged', () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive('plain')).toBe('plain');
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(undefined)).toBeUndefined();
  });

  it('breaks circular references with [Circular]', () => {
    const circular: Record<string, unknown> = { name: 'self' };
    circular.self = circular;
    const result = redactSensitive(circular) as Record<string, unknown>;
    expect(result.name).toBe('self');
    expect(result.self).toBe('[Circular]');
  });

  it('flags repeated object references as [Circular] via the seen-set', () => {
    // Not a cycle: `arr` holds the same object twice. The WeakSet marks it
    // seen on the first pass, so the second occurrence renders '[Circular]'.
    // Deliberate seen-set semantics — production bodies come from JSON.parse
    // and never share references, but the guard must stay bounded anyway.
    const inner: Record<string, unknown> = { token: 'x' };
    const arr = [inner, inner];
    const result = redactSensitive(arr) as Array<Record<string, unknown>>;
    expect(result[0]).toEqual({ token: '[REDACTED]' });
    expect(result[1]).toBe('[Circular]');
  });
});

describe('redactRequestUrl', () => {
  it('keeps path and origin but scrubs the query string', () => {
    expect(
      redactRequestUrl(
        '/repositories/ws/r?token=abc&other=xyz',
        'https://api.bitbucket.org/2.0'
      )
    ).toBe('https://api.bitbucket.org/2.0/repositories/ws/r?[redacted]');
  });

  it('keeps a URL without a query string unchanged', () => {
    expect(
      redactRequestUrl('/repositories/ws/r', 'https://api.bitbucket.org/2.0')
    ).toBe('https://api.bitbucket.org/2.0/repositories/ws/r');
  });

  it('preserves the base path for root-relative URLs', () => {
    // axios concatenates baseURL + url, so the logged URL must keep the
    // base path (e.g. /2.0) to match the actual wire request.
    expect(redactRequestUrl('/a/b', 'https://api.bitbucket.org/2.0')).toBe(
      'https://api.bitbucket.org/2.0/a/b'
    );
  });

  it('handles absolute request URLs', () => {
    expect(redactRequestUrl('https://example.com/x?a=1', undefined)).toBe(
      'https://example.com/x?[redacted]'
    );
  });

  it('falls back to a manual query split when URL parsing fails', () => {
    expect(redactRequestUrl('https://[invalid?a=1', undefined)).toBe(
      'https://[invalid?[redacted]'
    );
    expect(redactRequestUrl('https://[invalid', undefined)).toBe(
      'https://[invalid'
    );
  });
});

function retryError(
  status: number,
  headers: Record<string, string>
): AxiosError {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    data: {},
    status,
    statusText: String(status),
    headers,
    config: {} as InternalAxiosRequestConfig,
  });
}

describe('getRetryDelay', () => {
  it('honors a numeric Retry-After header on 429', () => {
    const error = retryError(429, { 'retry-after': '5' });
    expect(getRetryDelay(error, 1)).toBe(5000);
  });

  it('falls back to exponential backoff for a non-numeric Retry-After', () => {
    const error = retryError(429, { 'retry-after': 'soon' });
    expect(getRetryDelay(error, 1)).toBe(1000);
  });

  it('falls back to exponential backoff for an HTTP-date Retry-After', () => {
    const error = retryError(429, {
      'retry-after': 'Tue, 15 Nov 1994 08:12:31 GMT',
    });
    expect(getRetryDelay(error, 1)).toBe(1000);
  });

  it('ignores Retry-After on non-429 statuses', () => {
    const error = retryError(503, { 'retry-after': '99' });
    expect(getRetryDelay(error, 1)).toBe(1000);
  });

  it('escalates exponentially per attempt (1s/2s/4s)', () => {
    const error = retryError(503, {});
    expect(getRetryDelay(error, 1)).toBe(1000);
    expect(getRetryDelay(error, 2)).toBe(2000);
    expect(getRetryDelay(error, 3)).toBe(4000);
  });
});

describe('extractErrorMessage', () => {
  it('extracts the nested error.message', () => {
    expect(extractErrorMessage({ error: { message: 'Bad request' } })).toBe(
      'Bad request'
    );
  });

  it('appends formatted error.fields to the nested message', () => {
    expect(
      extractErrorMessage({
        error: { message: 'Bad request', fields: { title: ['missing'] } },
      })
    ).toBe('Bad request (title: missing)');
  });

  it('falls back to a top-level string message', () => {
    expect(extractErrorMessage({ message: 'Something failed' })).toBe(
      'Something failed'
    );
  });

  it('falls through to the top-level message when error.message is not a string', () => {
    expect(
      extractErrorMessage({ error: { message: 42 }, message: 'top' })
    ).toBe('top');
  });

  it('falls through to the top-level message when error is not an object', () => {
    expect(extractErrorMessage({ error: 'oops', message: 'top' })).toBe('top');
  });

  it('returns undefined for non-string messages and non-object data', () => {
    expect(extractErrorMessage({ message: 42 })).toBeUndefined();
    expect(extractErrorMessage('plain text')).toBeUndefined();
    expect(extractErrorMessage(null)).toBeUndefined();
  });
});

describe('formatErrorFields', () => {
  it('formats string reasons as key: reason pairs', () => {
    expect(formatErrorFields({ title: 'required' })).toBe('title: required');
  });

  it('joins array reasons with commas, skipping non-strings', () => {
    expect(formatErrorFields({ title: ['a', 'b'], name: [1, 'c'] })).toBe(
      'title: a, b; name: c'
    );
  });

  it('returns undefined for empty, non-object, or array input', () => {
    expect(formatErrorFields({})).toBeUndefined();
    expect(formatErrorFields('nope')).toBeUndefined();
    expect(formatErrorFields(null)).toBeUndefined();
    expect(formatErrorFields(['a', 'b'])).toBeUndefined();
  });

  it('drops non-string, non-array reasons', () => {
    expect(formatErrorFields({ title: 42, name: 'keep' })).toBe('name: keep');
  });
});

describe('resolveBaseUrl', () => {
  const originalBaseUrl = process.env.BB_API_BASE_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.BB_API_BASE_URL;
    } else {
      process.env.BB_API_BASE_URL = originalBaseUrl;
    }
  });

  it('defaults to the Bitbucket Cloud API when unset', () => {
    delete process.env.BB_API_BASE_URL;
    expect(resolveBaseUrl()).toBe('https://api.bitbucket.org/2.0');
  });

  it('uses BB_API_BASE_URL when set', () => {
    process.env.BB_API_BASE_URL = 'http://localhost:8080';
    expect(resolveBaseUrl()).toBe('http://localhost:8080');
  });

  it('strips trailing slashes and surrounding whitespace', () => {
    process.env.BB_API_BASE_URL = ' http://localhost:8080/2.0/// ';
    expect(resolveBaseUrl()).toBe('http://localhost:8080/2.0');
  });

  it('falls back to the default for a blank value', () => {
    process.env.BB_API_BASE_URL = '   ';
    expect(resolveBaseUrl()).toBe('https://api.bitbucket.org/2.0');
  });
});
