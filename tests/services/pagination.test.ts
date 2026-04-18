/**
 * Pagination helper tests
 */

import { describe, expect, it } from 'bun:test';
import {
  collectPages,
  DEFAULT_LIMIT,
  parseLimit,
  type PaginatedCollection,
} from '../../src/services/pagination.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

describe('parseLimit', () => {
  it('parses a valid positive integer', () => {
    expect(parseLimit('10')).toBe(10);
  });

  it('returns the default when the option is missing', () => {
    expect(parseLimit()).toBe(DEFAULT_LIMIT);
  });

  it('returns the provided fallback when the option is missing', () => {
    expect(parseLimit(undefined, 7)).toBe(7);
  });

  it('returns the default when the option is an empty string', () => {
    expect(parseLimit('')).toBe(DEFAULT_LIMIT);
  });

  it('throws for zero', () => {
    expect(() => parseLimit('0')).toThrow(BBError);
    try {
      parseLimit('0');
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toBe(
        '--limit must be a positive integer'
      );
    }
  });

  it('throws for negative integers', () => {
    expect(() => parseLimit('-5')).toThrow(BBError);
  });

  it('throws for non-numeric strings', () => {
    expect(() => parseLimit('abc')).toThrow(BBError);
  });

  it('truncates decimals via parseInt and accepts the integer part', () => {
    expect(parseLimit('10.9')).toBe(10);
  });
});

describe('collectPages', () => {
  it('returns items from a single page', async () => {
    const result = await collectPages<number>({
      limit: 10,
      fetchPage: async () => ({ values: [1, 2, 3] }),
    });

    expect(result).toEqual([1, 2, 3]);
  });

  it('truncates multi-page results to the configured limit', async () => {
    const pages: Array<PaginatedCollection<number>> = [
      { values: [1, 2, 3], next: 'page2' },
      { values: [4, 5, 6], next: 'page3' },
      { values: [7, 8, 9] },
    ];
    const calls: number[] = [];

    const result = await collectPages<number>({
      limit: 5,
      pageSize: 3,
      fetchPage: async (page) => {
        calls.push(page);
        return pages[page - 1] ?? { values: [] };
      },
    });

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(calls).toEqual([1, 2]);
  });

  it('returns an empty array when the first page is empty', async () => {
    const result = await collectPages<number>({
      limit: 10,
      fetchPage: async () => ({ values: [] }),
    });

    expect(result).toEqual([]);
  });

  it('stops when next is a malformed URL without crashing', async () => {
    const pages: Array<PaginatedCollection<number>> = [
      { values: [1, 2], next: 'not-a-valid-url://???' },
      { values: [3, 4] },
    ];
    const calls: number[] = [];

    const result = await collectPages<number>({
      limit: 10,
      pageSize: 2,
      fetchPage: async (page) => {
        calls.push(page);
        return pages[page - 1] ?? { values: [] };
      },
    });

    expect(result).toEqual([1, 2, 3, 4]);
    expect(calls).toEqual([1, 2]);
  });

  it('propagates errors thrown by fetchPage', async () => {
    const failure = new Error('boom');

    await expect(
      collectPages<number>({
        limit: 10,
        fetchPage: async () => {
          throw failure;
        },
      })
    ).rejects.toBe(failure);
  });

  it('filters items using shouldInclude', async () => {
    const result = await collectPages<number>({
      limit: 10,
      fetchPage: async () => ({ values: [1, 2, 3, 4] }),
      shouldInclude: (value) => value % 2 === 0,
    });

    expect(result).toEqual([2, 4]);
  });
});
