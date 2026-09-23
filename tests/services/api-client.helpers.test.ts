/**
 * Direct unit tests for the api-client helper functions exported for the
 * interceptor suite (issue #265): retry delay, base URL resolution and
 * error-message extraction. The debug redaction helpers are covered in
 * http-debug.test.ts.
 */

import { describe, it, expect, afterEach } from 'bun:test';
import {
  errorBodySummary,
  extractErrorMessage,
  formatErrorFields,
  getRetryDelay,
  resolveBaseUrl,
} from '../../src/services/api-client.service.js';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

describe('errorBodySummary', () => {
  it('returns a non-empty string body as-is after trimming', () => {
    expect(errorBodySummary('  Bad Request  ')).toBe('Bad Request');
  });

  it('collapses internal whitespace so the message stays one line', () => {
    expect(errorBodySummary('Bad\n  Request\there')).toBe('Bad Request here');
  });

  it('returns undefined for empty/whitespace-only strings', () => {
    expect(errorBodySummary('')).toBeUndefined();
    expect(errorBodySummary('   \n ')).toBeUndefined();
  });

  it('ignores non-string bodies (left to extractErrorMessage)', () => {
    expect(errorBodySummary({ error: { message: 'x' } })).toBeUndefined();
    expect(errorBodySummary(null)).toBeUndefined();
    expect(errorBodySummary(undefined)).toBeUndefined();
  });

  it('truncates long bodies with an ellipsis', () => {
    const summary = errorBodySummary('x'.repeat(300));
    expect(summary).toBeDefined();
    expect(summary!.length).toBe(200);
    expect(summary!.endsWith('...')).toBe(true);
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
