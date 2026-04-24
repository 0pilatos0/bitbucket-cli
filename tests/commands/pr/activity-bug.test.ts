/**
 * Tests to reproduce bug in activity command where getActorName and
 * formatActivityDate don't match the order of getActivityType
 */

import { describe, it, expect } from 'bun:test';
import { ActivityPRCommand } from '../../../src/commands/pr/activity.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import type { PullrequestsApi } from '../../../src/generated/api.js';
import type { AxiosResponse } from 'axios';
import { mockUser } from '../../setup.js';

// Mock activity with BOTH changes_requested and update set
// getActivityType checks changes_requested BEFORE update, so type = 'changes_requested'
// But getActorName checks update.author BEFORE changes_requested.user (BUG)
// And formatActivityDate checks update.date BEFORE changes_requested.date (BUG)
const mockActivityWithBoth = {
  changes_requested: {
    user: { ...mockUser, display_name: 'CR User' },
    reason: 'Needs work',
    date: '2024-03-01T00:00:00.000Z',
  },
  update: {
    author: { ...mockUser, display_name: 'Update Author' },
    date: '2024-03-02T00:00:00.000Z',
    title: 'Updated title',
  },
};

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as Record<string, unknown>,
  };
}

function createSet<T>(items: T[]): Set<T> {
  return new Set(items);
}

function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  if (!axiosOptions || typeof axiosOptions !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const params = (axiosOptions as { params?: unknown }).params;
  if (!params || typeof params !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const pageValue = (params as { page?: unknown }).page;
  const pagelenValue = (params as { pagelen?: unknown }).pagelen;

  const page =
    typeof pageValue === 'number' && Number.isFinite(pageValue) && pageValue > 0
      ? pageValue
      : 1;
  const pagelen =
    typeof pagelenValue === 'number' &&
    Number.isFinite(pagelenValue) &&
    pagelenValue > 0
      ? pagelenValue
      : 25;

  return { page, pagelen };
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }

  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

function createMockPullrequestsApi(): PullrequestsApi {
  const mockApi = {
    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet(
      params: { pullRequestId: number },
      axiosOptions?: unknown
    ) {
      const { page, pagelen } = extractPaginationParams(axiosOptions);

      // Only return data on first page
      const pageValues = page === 1 ? [mockActivityWithBoth] : [];

      return createAxiosResponse({
        values: createSet(pageValues),
        page,
        pagelen,
        size: pageValues.length,
        next:
          pageValues.length > 0
            ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/${params.pullRequestId}/activity?page=${page + 1}`
            : undefined,
      } as unknown as void);
    },
  };

  return mockApi as unknown as PullrequestsApi;
}

describe('ActivityPRCommand bug: getActorName and formatActivityDate order', () => {
  it('should use changes_requested user when activity type is changes_requested (not update author)', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);

    // The actor should be 'CR User' (from changes_requested.user)
    // NOT 'Update Author' (from update.author)
    // Bug: Currently returns 'Update Author' because getActorName checks update before changes_requested
    expect(rows[0][1]).toBe('CR User');
  });

  it('should use changes_requested date when activity type is changes_requested (not update date)', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);

    // The date should be from changes_requested.date ('2024-03-01...')
    // Bug: Currently uses update.date ('2024-03-02...') because formatActivityDate checks update before changes_requested
    const rowDate = rows[0][2];
    expect(rowDate).toContain('2024-03-01');
  });
});
