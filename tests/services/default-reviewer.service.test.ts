/**
 * DefaultReviewerService tests.
 */

import { describe, it, expect } from 'bun:test';
import type { AxiosResponse } from 'axios';
import { DefaultReviewerService } from '../../src/services/default-reviewer.service.js';
import type {
  Account,
  DefaultReviewerAndType,
  PaginatedAccounts,
  PaginatedDefaultReviewerAndType,
  PullrequestsApi,
} from '../../src/generated/api.js';

function axiosOk<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  };
}

interface MockOptions {
  effectivePages?: DefaultReviewerAndType[][];
  directPages?: Account[][];
  throwOnPut?: boolean;
  throwOnDelete?: boolean;
  onPut?: (username: string) => void;
  onDelete?: (username: string) => void;
}

function createMockApi(options: MockOptions = {}): PullrequestsApi {
  const paginate = <T>(
    pages: T[][] | undefined,
    page: number
  ): { values: Set<T>; next?: string; page: number } => {
    const values = new Set<T>(pages?.[page - 1] ?? []);
    const hasNext = !!pages && page < pages.length;
    return {
      values,
      next: hasNext ? `page=${page + 1}` : undefined,
      page,
    };
  };

  const api = {
    async repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet(
      _params: { workspace: string; repoSlug: string },
      axiosOpts?: { params?: { page?: number; pagelen?: number } }
    ) {
      const page = axiosOpts?.params?.page ?? 1;
      const paginated = paginate(options.effectivePages, page);
      return axiosOk({
        size: (options.effectivePages ?? []).flat().length,
        page: paginated.page,
        pagelen: axiosOpts?.params?.pagelen ?? 25,
        next: paginated.next,
        values: paginated.values,
      } as PaginatedDefaultReviewerAndType);
    },
    async repositoriesWorkspaceRepoSlugDefaultReviewersGet(
      _params: { workspace: string; repoSlug: string },
      axiosOpts?: { params?: { page?: number; pagelen?: number } }
    ) {
      const page = axiosOpts?.params?.page ?? 1;
      const paginated = paginate(options.directPages, page);
      return axiosOk({
        size: (options.directPages ?? []).flat().length,
        page: paginated.page,
        pagelen: axiosOpts?.params?.pagelen ?? 25,
        next: paginated.next,
        values: paginated.values,
      } as PaginatedAccounts);
    },
    async repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut(params: {
      workspace: string;
      repoSlug: string;
      targetUsername: string;
    }) {
      if (options.throwOnPut) {
        throw new Error('forbidden');
      }
      options.onPut?.(params.targetUsername);
      return axiosOk<Account>({
        type: 'user',
        uuid: `{${params.targetUsername}-uuid}`,
        display_name: `Display ${params.targetUsername}`,
      });
    },
    async repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete(params: {
      workspace: string;
      repoSlug: string;
      targetUsername: string;
    }) {
      if (options.throwOnDelete) {
        throw new Error('forbidden');
      }
      options.onDelete?.(params.targetUsername);
      return axiosOk(undefined);
    },
  };

  return api as unknown as PullrequestsApi;
}

const repo = { workspace: 'ws', repoSlug: 'repo' };

describe('DefaultReviewerService', () => {
  describe('list (effective)', () => {
    it('returns entries with reviewer_type and walks pagination', async () => {
      const api = createMockApi({
        effectivePages: [
          [
            {
              type: 'default_reviewer_and_type',
              reviewer_type: 'repository',
              user: {
                type: 'user',
                uuid: '{a-uuid}',
                display_name: 'Alice',
                account_id: 'alice-id',
                nickname: 'alice',
              } as DefaultReviewerAndType['user'],
            },
          ],
          [
            {
              type: 'default_reviewer_and_type',
              reviewer_type: 'project',
              user: {
                type: 'user',
                uuid: '{b-uuid}',
                display_name: 'Bob',
              } as DefaultReviewerAndType['user'],
            },
          ],
        ],
      });

      const service = new DefaultReviewerService(api);
      const result = await service.list(repo, 'effective');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uuid: '{a-uuid}',
        accountId: 'alice-id',
        displayName: 'Alice',
        nickname: 'alice',
        reviewerType: 'repository',
      });
      expect(result[1]?.reviewerType).toBe('project');
    });

    it('returns an empty array when the list is empty', async () => {
      const api = createMockApi({ effectivePages: [[]] });
      const service = new DefaultReviewerService(api);
      const result = await service.list(repo, 'effective');
      expect(result).toEqual([]);
    });

    it('skips entries without a user uuid', async () => {
      const api = createMockApi({
        effectivePages: [
          [
            {
              type: 'default_reviewer_and_type',
              reviewer_type: 'repository',
              user: { type: 'user' } as DefaultReviewerAndType['user'],
            },
          ],
        ],
      });
      const service = new DefaultReviewerService(api);
      const result = await service.list(repo, 'effective');
      expect(result).toEqual([]);
    });
  });

  describe('list (direct)', () => {
    it('returns accounts from the direct endpoint', async () => {
      const api = createMockApi({
        directPages: [
          [
            {
              type: 'user',
              uuid: '{c-uuid}',
              display_name: 'Carol',
            } as Account,
          ],
        ],
      });

      const service = new DefaultReviewerService(api);
      const result = await service.list(repo, 'direct');

      expect(result).toEqual([
        {
          uuid: '{c-uuid}',
          accountId: undefined,
          displayName: 'Carol',
          nickname: undefined,
        },
      ]);
    });
  });

  describe('add', () => {
    it('calls PUT and maps the returned account', async () => {
      let seen = '';
      const api = createMockApi({ onPut: (u) => (seen = u) });
      const service = new DefaultReviewerService(api);

      const entry = await service.add(repo, 'alice');

      expect(seen).toBe('alice');
      expect(entry.uuid).toBe('{alice-uuid}');
      expect(entry.displayName).toBe('Display alice');
    });
  });

  describe('remove', () => {
    it('calls DELETE with the username', async () => {
      let seen = '';
      const api = createMockApi({ onDelete: (u) => (seen = u) });
      const service = new DefaultReviewerService(api);

      await service.remove(repo, 'alice');
      expect(seen).toBe('alice');
    });
  });
});
