/**
 * Pagination helpers for Bitbucket paginated endpoints.
 */

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

export function parseLimit(
  limit?: string,
  fallback: number = DEFAULT_LIMIT
): number {
  if (!limit) {
    return fallback;
  }

  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function collectPages<T>(
  options: CollectPagesOptions<T>
): Promise<T[]> {
  const { fetchPage, shouldInclude } = options;
  const limit = Math.max(0, options.limit);

  if (limit === 0) {
    return [];
  }

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

    for (const value of pageValues) {
      if (shouldInclude && !shouldInclude(value)) {
        continue;
      }

      items.push(value);
      if (items.length >= limit) {
        return items;
      }
    }

    if (!data.next) {
      break;
    }

    page += 1;
  }

  return items;
}
