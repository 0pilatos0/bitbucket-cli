/**
 * Pagination helpers for Bitbucket paginated endpoints.
 */

import { BBError, ErrorCode } from '../types/errors.js';

export interface PaginatedCollection<T> {
  values?: Iterable<T>;
  next?: string;
}

export interface CollectPagesOptions<T> {
  limit: number;
  pageSize?: number;
  fetchPage: (page: number, pagelen: number) => Promise<PaginatedCollection<T>>;
  shouldInclude?: (item: T) => boolean;
}

export const DEFAULT_LIMIT = 25;
export const MAX_PAGE_LENGTH = 50;

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

  const items: T[] = [];
  let page = 1;

  while (items.length < limit) {
    const data = await fetchPage(page, pagelen);
    const pageValues = data.values ? Array.from(data.values) : [];

    if (pageValues.length === 0) {
      break;
    }

    for (let i = 0; i < pageValues.length; i += 1) {
      const value = pageValues[i]!;
      if (shouldInclude && !shouldInclude(value)) {
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
  }

  return { items, hasMore: false };
}

export async function collectPages<T>(
  options: CollectPagesOptions<T>
): Promise<T[]> {
  return (await collectPagesWithMeta(options)).items;
}
