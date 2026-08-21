/**
 * Pagination helpers for Bitbucket paginated endpoints.
 */

import { BBError, ErrorCode } from '../types/errors.js';

export interface PaginatedCollection<T> {
  values?: Iterable<T>;
  next?: string;
  /**
   * Total number of items in the collection server-side (Bitbucket sends
   * `size` on paginated list endpoints). Used by the `--all` fast path to
   * compute the page count up front and fetch pages concurrently; absent or
   * non-numeric values fall back to the sequential walk.
   */
  size?: number;
}

export interface CollectPagesOptions<T> {
  limit: number;
  pageSize?: number;
  fetchPage: (page: number, pagelen: number) => Promise<PaginatedCollection<T>>;
  shouldInclude?: (item: T) => boolean;
  /**
   * Max pages fetched in flight on the `--all` fast path. Finite limits never
   * parallelize (early-stop at the cap must stay exact). Set to 1 to force
   * sequential fetching.
   */
  concurrency?: number;
}

export const DEFAULT_LIMIT = 25;
export const MAX_PAGE_LENGTH = 50;

/**
 * Pages fetched in flight when `--all` can use the size-driven fast path.
 * Four keeps aggregate throughput well under Bitbucket's rate limits while
 * cutting wall-clock time for large collections roughly 3-4x versus a
 * strictly sequential walk.
 */
export const PAGE_FETCH_CONCURRENCY = 4;

/**
 * Result of {@link collectPagesWithMeta}: the collected items plus whether the
 * collection was cut short by the limit (i.e. more results exist on the server
 * than were returned). `hasMore` lets callers print a "use --limit/--all to see
 * more" hint without a second request.
 */
export interface CollectPagesResult<T> {
  items: T[];
  hasMore: boolean;
}

export function parseLimit(
  limit?: string,
  fallback: number = DEFAULT_LIMIT
): number {
  if (limit === undefined || limit === '') {
    return fallback;
  }

  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: '--limit must be a positive integer',
    });
  }

  return parsed;
}

/**
 * Resolve the effective item limit for a list command. `--all` requests every
 * page (represented as `Infinity`); otherwise the `--limit` value is parsed,
 * falling back to {@link DEFAULT_LIMIT}.
 */
export function resolveLimit(options: {
  all?: boolean;
  limit?: string;
}): number {
  return options.all ? Number.POSITIVE_INFINITY : parseLimit(options.limit);
}

/**
 * Collect items across paginated pages, stopping at `limit`, and report whether
 * more results remain on the server. Pass `limit = Infinity` to fetch every
 * page (`--all`).
 *
 * For `--all`, when the first page carries a numeric `size`, pages are fetched
 * with bounded concurrency ({@link CollectPagesOptions.concurrency}) and
 * concatenated in page order; without a usable `size` the walk stays strictly
 * sequential, driven by the server's `next` links. Finite limits always walk
 * sequentially so early-stop at the cap remains exact.
 */
export async function collectPagesWithMeta<T>(
  options: CollectPagesOptions<T>
): Promise<CollectPagesResult<T>> {
  const { fetchPage, shouldInclude } = options;
  const limit = Math.max(0, options.limit);

  if (limit === 0) {
    return { items: [], hasMore: false };
  }

  // pageSize is unbounded for --all (Infinity); clamp to the API's max so each
  // request stays valid while we loop until the server runs out of pages.
  const requestedPageSize = options.pageSize ?? limit;
  const pagelen = Math.max(1, Math.min(requestedPageSize, MAX_PAGE_LENGTH));
  const concurrency = Math.max(
    1,
    options.concurrency ?? PAGE_FETCH_CONCURRENCY
  );
  const include = (value: T): boolean => !shouldInclude || shouldInclude(value);

  const items: T[] = [];
  let page = 1;
  let data = await fetchPage(page, pagelen);

  // --all fast path: the server told us how many items exist in total, so the
  // page count is computable up front (`ceil(size / observed page length)`).
  // Fetch remaining pages in windows of `concurrency` and concatenate in page
  // order — later pages resolving first never reorder results.
  if (
    limit === Number.POSITIVE_INFINITY &&
    concurrency > 1 &&
    typeof data.size === 'number' &&
    Number.isFinite(data.size)
  ) {
    const firstValues = data.values ? Array.from(data.values) : [];

    if (firstValues.length === 0) {
      return { items: [], hasMore: false };
    }

    const observedPageLength = Math.max(firstValues.length, 1);
    const totalPages = Math.max(1, Math.ceil(data.size / observedPageLength));

    // Page order is preserved regardless of resolution order: page 1's items
    // go in first, then each batch appends its pages in ascending page order.
    for (const value of firstValues) {
      if (include(value)) {
        items.push(value);
      }
    }

    for (
      let batchStart = 2;
      batchStart <= totalPages;
      batchStart += concurrency
    ) {
      const batchEnd = Math.min(batchStart + concurrency - 1, totalPages);
      const pending: Promise<PaginatedCollection<T>>[] = [];
      for (let p = batchStart; p <= batchEnd; p += 1) {
        pending.push(fetchPage(p, pagelen));
      }
      // A failed page aborts the whole collection via Promise.all rejection.
      const batchResults = await Promise.all(pending);
      for (const result of batchResults) {
        const values = result.values ? Array.from(result.values) : [];
        for (const value of values) {
          if (include(value)) {
            items.push(value);
          }
        }
      }
    }

    return { items, hasMore: false };
  }

  while (items.length < limit) {
    const pageValues = data.values ? Array.from(data.values) : [];

    if (pageValues.length === 0) {
      break;
    }

    for (let i = 0; i < pageValues.length; i += 1) {
      const value = pageValues[i]!;
      if (!include(value)) {
        continue;
      }

      items.push(value);
      if (items.length >= limit) {
        // We hit the cap. More results exist if any later value on this page
        // would have been included, or another page follows.
        const moreOnThisPage = pageValues
          .slice(i + 1)
          .some((rest) => !shouldInclude || shouldInclude(rest));
        return { items, hasMore: moreOnThisPage || Boolean(data.next) };
      }
    }

    if (!data.next) {
      break;
    }

    page += 1;
    data = await fetchPage(page, pagelen);
  }

  return { items, hasMore: false };
}

export async function collectPages<T>(
  options: CollectPagesOptions<T>
): Promise<T[]> {
  return (await collectPagesWithMeta(options)).items;
}
