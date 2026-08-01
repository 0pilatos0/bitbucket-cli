/**
 * Tests for the pure `bb api` passthrough helpers.
 */

import { describe, it, expect } from 'bun:test';
import {
  buildFieldObject,
  buildRequestParts,
  findPlaceholders,
  getNextUrl,
  getValues,
  isHttpMethod,
  magicType,
  normalizeEndpoint,
  normalizeMethod,
  parseFieldAssignment,
  parseHeader,
  parseHeaders,
  resolveMethod,
  serializeQueryParams,
  substitutePlaceholders,
} from '../../src/services/api-passthrough.js';
import { BBError } from '../../src/types/errors.js';

describe('method helpers', () => {
  it('detects HTTP verbs case-insensitively', () => {
    expect(isHttpMethod('get')).toBe(true);
    expect(isHttpMethod('POST')).toBe(true);
    expect(isHttpMethod('/user')).toBe(false);
    expect(isHttpMethod('repositories')).toBe(false);
  });

  it('normalizes valid verbs and rejects others', () => {
    expect(normalizeMethod('patch')).toBe('PATCH');
    expect(normalizeMethod('frobnicate')).toBeUndefined();
  });

  it('honors precedence: explicit > positional > inferred', () => {
    expect(
      resolveMethod({ explicit: 'delete', positional: 'GET', hasParams: true })
    ).toBe('DELETE');
    expect(resolveMethod({ positional: 'PUT', hasParams: false })).toBe('PUT');
    expect(resolveMethod({ hasParams: true })).toBe('POST');
    expect(resolveMethod({ hasParams: false })).toBe('GET');
  });

  it('throws on an invalid explicit method', () => {
    expect(() => resolveMethod({ explicit: 'nope', hasParams: false })).toThrow(
      BBError
    );
  });

  it('suggests a near-miss verb, folding case', () => {
    expect(() => resolveMethod({ explicit: 'GTE', hasParams: false })).toThrow(
      '(Did you mean GET?)'
    );
    expect(() =>
      resolveMethod({ explicit: 'ptach', hasParams: false })
    ).toThrow('(Did you mean PATCH?)');
  });

  it('normalizes a valid positional verb regardless of case', () => {
    // The positional path is validated separately from -X/--method (in
    // api.command.ts); both must suggest, or the same typo behaves differently
    // depending on where the user put the verb.
    expect(isHttpMethod('gte')).toBe(false);
    expect(isHttpMethod('get')).toBe(true);
  });

  it('adds no suggestion line when nothing is close enough', () => {
    let message = '';
    try {
      resolveMethod({ explicit: 'nope', hasParams: false });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe(
      '--method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS'
    );
  });
});

describe('field parsing', () => {
  it('splits key=value and rejects missing =', () => {
    expect(parseFieldAssignment('title=Bug')).toEqual({
      key: 'title',
      rawValue: 'Bug',
    });
    expect(parseFieldAssignment('a=b=c')).toEqual({
      key: 'a',
      rawValue: 'b=c',
    });
    expect(() => parseFieldAssignment('noequals')).toThrow(BBError);
    expect(() => parseFieldAssignment('=novalue')).toThrow(BBError);
  });

  it('applies gh-style magic typing', () => {
    expect(magicType('true')).toBe(true);
    expect(magicType('false')).toBe(false);
    expect(magicType('null')).toBeNull();
    expect(magicType('42')).toBe(42);
    expect(magicType('-7')).toBe(-7);
    expect(magicType('3.14')).toBe(3.14);
    expect(magicType('hello')).toBe('hello');
  });

  it('keeps oversized integers as strings to avoid precision loss', () => {
    const big = '123456789012345678901234567890';
    expect(magicType(big)).toBe(big);
  });

  it('collapses repeated keys into arrays', () => {
    const obj = buildFieldObject([
      { key: 'label', value: 'a' },
      { key: 'label', value: 'b' },
      { key: 'title', value: 'x' },
    ]);
    expect(obj).toEqual({ label: ['a', 'b'], title: 'x' });
  });
});

describe('query / body distribution', () => {
  it('serializes query params with repeated keys', () => {
    expect(serializeQueryParams({ q: 'a b', n: 2 })).toBe('q=a%20b&n=2');
    expect(serializeQueryParams({ k: ['a', 'b'] })).toBe('k=a&k=b');
    expect(serializeQueryParams({ k: null })).toBe('k=null');
  });

  it('routes fields to query for GET and to body otherwise', () => {
    expect(buildRequestParts({ method: 'GET', fields: { q: 'x' } })).toEqual({
      query: 'q=x',
    });
    expect(
      buildRequestParts({ method: 'POST', fields: { title: 'x' } })
    ).toEqual({ data: { title: 'x' } });
  });

  it('prefers a raw body over fields', () => {
    expect(
      buildRequestParts({ method: 'PUT', fields: {}, rawBody: '{"a":1}' })
    ).toEqual({ data: '{"a":1}' });
  });

  it('returns nothing when there are no fields or body', () => {
    expect(buildRequestParts({ method: 'GET', fields: {} })).toEqual({});
  });
});

describe('endpoint handling', () => {
  it('adds a leading slash to relative paths', () => {
    expect(normalizeEndpoint('user')).toBe('/user');
    expect(normalizeEndpoint('/user')).toBe('/user');
  });

  it('strips a redundant leading /2.0', () => {
    expect(normalizeEndpoint('/2.0/user')).toBe('/user');
    expect(normalizeEndpoint('2.0/repositories')).toBe('/repositories');
  });

  it('allows absolute URLs only for the Bitbucket API host', () => {
    expect(normalizeEndpoint('https://api.bitbucket.org/2.0/user')).toBe(
      'https://api.bitbucket.org/2.0/user'
    );
    expect(() => normalizeEndpoint('https://evil.example.com/x')).toThrow(
      BBError
    );
  });

  it('rejects an empty endpoint', () => {
    expect(() => normalizeEndpoint('   ')).toThrow(BBError);
  });

  it('finds and substitutes placeholders', () => {
    expect(findPlaceholders('/repositories/{workspace}/{repo}')).toEqual({
      workspace: true,
      repo: true,
    });
    expect(
      substitutePlaceholders('/repositories/{workspace}/{repo}/pullrequests', {
        workspace: 'ws',
        repo: 'r',
      })
    ).toBe('/repositories/ws/r/pullrequests');
  });

  it('throws when a placeholder cannot be resolved', () => {
    expect(() =>
      substitutePlaceholders('/repositories/{workspace}', {})
    ).toThrow(BBError);
    expect(() =>
      substitutePlaceholders('/repositories/{workspace}/{repo}', {
        workspace: 'ws',
      })
    ).toThrow(BBError);
  });
});

describe('pagination accessors', () => {
  it('reads next and values from a page', () => {
    const page = {
      values: [1, 2],
      next: 'https://api.bitbucket.org/2.0/x?page=2',
    };
    expect(getValues(page)).toEqual([1, 2]);
    expect(getNextUrl(page)).toBe('https://api.bitbucket.org/2.0/x?page=2');
  });

  it('returns undefined for non-paginated payloads', () => {
    expect(getValues({ username: 'x' })).toBeUndefined();
    expect(getNextUrl({ username: 'x' })).toBeUndefined();
    expect(getValues([1, 2])).toBeUndefined();
    expect(getNextUrl('not an object')).toBeUndefined();
  });
});

describe('header parsing', () => {
  it('splits Name: value and trims', () => {
    expect(parseHeader('Accept: text/plain')).toEqual({
      name: 'Accept',
      value: 'text/plain',
    });
    expect(() => parseHeader('no-colon')).toThrow(BBError);
  });

  it('builds a header object with later duplicates winning', () => {
    expect(parseHeaders(['Accept: a', 'Accept: b', 'X-Test: 1'])).toEqual({
      Accept: 'b',
      'X-Test': '1',
    });
  });
});
