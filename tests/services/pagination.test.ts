/**
 * Pagination helper tests
 */

import { describe, expect, it } from 'bun:test';
import {
  collectPages,
  collectPagesWithMeta,
  DEFAULT_LIMIT,
  parseLimit,
  resolveLimit,
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

  it('normalizes Set-valued pages (Bitbucket may return a Set)', async () => {
    const result = await collectPages<number>({
      limit: 10,
      fetchPage: async () => ({ values: new Set([1, 2, 3]) }),
    });

    expect(result).toEqual([1, 2, 3]);
  });

  it('walks pagination across mixed Set/Array pages', async () => {
    const pages: Array<PaginatedCollection<number>> = [
      { values: new Set([1, 2]), next: 'page2' },
      { values: [3, 4], next: 'page3' },
      { values: new Set([5]) },
    ];

    const result = await collectPages<number>({
      limit: 10,
      pageSize: 2,
      fetchPage: async (page) => pages[page - 1] ?? { values: [] },
    });

    expect(result).toEqual([1, 2, 3, 4, 5]);
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

describe('resolveLimit', () => {
  it('returns Infinity when --all is set, ignoring --limit', () => {
    expect(resolveLimit({ all: true, limit: '10' })).toBe(
      Number.POSITIVE_INFINITY
    );
  });

  it('parses --limit when --all is not set', () => {
    expect(resolveLimit({ limit: '10' })).toBe(10);
  });

  it('falls back to the default limit when neither is set', () => {
    expect(resolveLimit({})).toBe(DEFAULT_LIMIT);
  });
});

describe('collectPagesWithMeta', () => {
  it('reports hasMore=false when everything fits under the limit', async () => {
    const result = await collectPagesWithMeta<number>({
      limit: 10,
      fetchPage: async () => ({ values: [1, 2, 3] }),
    });

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(false);
  });

  it('reports hasMore=true when more items remain on the capped page', async () => {
    const result = await collectPagesWithMeta<number>({
      limit: 2,
      pageSize: 5,
      fetchPage: async () => ({ values: [1, 2, 3, 4, 5] }),
    });

    expect(result.items).toEqual([1, 2]);
    expect(result.hasMore).toBe(true);
  });

  it('reports hasMore=true when the limit ends a page but another follows', async () => {
    const pages: Array<PaginatedCollection<number>> = [
      { values: [1, 2, 3], next: 'page2' },
      { values: [4, 5, 6] },
    ];

    const result = await collectPagesWithMeta<number>({
      limit: 3,
      pageSize: 3,
      fetchPage: async (page) => pages[page - 1] ?? { values: [] },
    });

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(true);
  });

  it('reports hasMore=false when the limit ends the final page exactly', async () => {
    const result = await collectPagesWithMeta<number>({
      limit: 3,
      pageSize: 3,
      fetchPage: async () => ({ values: [1, 2, 3] }),
    });

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(false);
  });

  it('collects every page when limit is Infinity (--all)', async () => {
    const pages: Array<PaginatedCollection<number>> = [
      { values: [1, 2], next: 'page2' },
      { values: [3, 4], next: 'page3' },
      { values: [5] },
    ];
    const calls: number[] = [];

    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      fetchPage: async (page) => {
        calls.push(page);
        return pages[page - 1] ?? { values: [] };
      },
    });

    expect(result.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.hasMore).toBe(false);
    expect(calls).toEqual([1, 2, 3]);
  });

  it('ignores filtered-out trailing values when computing hasMore', async () => {
    // Only even values are included; after collecting [2] at the cap, the
    // remaining page values (3) are filtered out and there is no next page,
    // so nothing more would actually be shown.
    const result = await collectPagesWithMeta<number>({
      limit: 1,
      pageSize: 3,
      fetchPage: async () => ({ values: [1, 2, 3] }),
      shouldInclude: (value) => value % 2 === 0,
    });

    expect(result.items).toEqual([2]);
    expect(result.hasMore).toBe(false);
  });
});

describe('collectPagesWithMeta concurrency (--all fast path)', () => {
  /** Deferred page source that tracks in-flight requests for overlap checks. */
  function makeDeferredSource(
    pages: PaginatedCollection<number>[],
    options: { releaseAll?: boolean } = {}
  ) {
    let inFlight = 0;
    const peakInFlight = { value: 0 };
    const calls: number[] = [];

    return {
      calls,
      peakInFlight,
      fetchPage: async (page: number): Promise<PaginatedCollection<number>> => {
        calls.push(page);
        inFlight += 1;
        peakInFlight.value = Math.max(peakInFlight.value, inFlight);
        // Yield a macrotask so concurrently started fetches genuinely overlap.
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;
        return pages[page - 1] ?? { values: [] };
      },
      ...options,
    };
  }

  function sizedPages(
    values: number[],
    perPage: number
  ): PaginatedCollection<number>[] {
    const pages: PaginatedCollection<number>[] = [];
    for (let i = 0; i < values.length; i += perPage) {
      pages.push({ values: values.slice(i, i + perPage), size: values.length });
    }
    return pages;
  }

  it('collects every page with bounded concurrency when size is known', async () => {
    const source = makeDeferredSource(sizedPages([1, 2, 3, 4, 5, 6], 2));

    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      pageSize: 2,
      fetchPage: source.fetchPage,
    });

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.hasMore).toBe(false);
    // Pages 2-3 are the only remaining ones; both must be requested together.
    expect(source.calls[0]).toBe(1);
    expect(source.calls.slice(1).sort((a, b) => a - b)).toEqual([2, 3]);
    expect(source.peakInFlight.value).toBe(2);
  });

  it('caps in-flight pages at the configured concurrency', async () => {
    const source = makeDeferredSource(sizedPages(range(1, 13), 2));

    await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      pageSize: 2,
      fetchPage: source.fetchPage,
      concurrency: 3,
    });

    // Pages 2..7 exist after page 1; windows of 3 → peak of exactly 3.
    expect(source.peakInFlight.value).toBe(3);
    expect(source.calls.sort((a, b) => a - b)).toEqual(range(1, 7));
  });

  it('preserves page order even when later pages resolve first', async () => {
    const pages = sizedPages([1, 2, 3, 4, 5, 6], 2);

    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      pageSize: 2,
      fetchPage: async (page) => {
        const data = pages[page - 1]!;
        // Page 3 resolves fastest, page 2 slowest.
        const delay = page === 3 ? 0 : page === 2 ? 30 : 5;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return data;
      },
    });

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('falls back to strictly sequential fetching without size', async () => {
    const source = makeDeferredSource([
      { values: [1, 2], next: 'page2' },
      { values: [3, 4], next: 'page3' },
      { values: [5, 6] },
    ]);

    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      pageSize: 2,
      fetchPage: source.fetchPage,
    });

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(source.peakInFlight.value).toBe(1);
    expect(source.calls).toEqual([1, 2, 3]);
  });

  it('never parallelizes finite limits', async () => {
    const source = makeDeferredSource(sizedPages([1, 2, 3, 4], 2));

    const result = await collectPagesWithMeta<number>({
      limit: 2,
      pageSize: 2,
      fetchPage: source.fetchPage,
    });

    expect(result.items).toEqual([1, 2]);
    // Cap hit exactly at page end with no next link: unchanged sequential
    // semantics report nothing more to show.
    expect(result.hasMore).toBe(false);
    expect(source.calls).toEqual([1]);
  });

  it('applies shouldInclude on the concurrent path', async () => {
    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      pageSize: 2,
      fetchPage: async () => ({ values: [1, 2, 3, 4], size: 4 }),
      shouldInclude: (value) => value % 2 === 0,
    });

    expect(result.items).toEqual([2, 4]);
    expect(result.hasMore).toBe(false);
  });

  it('returns an empty result for an empty first page on --all', async () => {
    const calls: number[] = [];
    const result = await collectPagesWithMeta<number>({
      limit: Number.POSITIVE_INFINITY,
      fetchPage: async (page) => {
        calls.push(page);
        return { values: [], size: 0 };
      },
    });

    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(calls).toEqual([1]);
  });
});

function range(startInclusive: number, endInclusive: number): number[] {
  const out: number[] = [];
  for (let i = startInclusive; i <= endInclusive; i += 1) out.push(i);
  return out;
}
