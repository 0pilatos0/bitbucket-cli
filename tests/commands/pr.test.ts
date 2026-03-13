/**
 * PR command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListPRsCommand } from '../../src/commands/pr/list.command.js';
import { ViewPRCommand } from '../../src/commands/pr/view.command.js';
import { CreatePRCommand } from '../../src/commands/pr/create.command.js';
import { EditPRCommand } from '../../src/commands/pr/edit.command.js';
import { MergePRCommand } from '../../src/commands/pr/merge.command.js';
import { ApprovePRCommand } from '../../src/commands/pr/approve.command.js';
import { DeclinePRCommand } from '../../src/commands/pr/decline.command.js';
import { ReadyPRCommand } from '../../src/commands/pr/ready.command.js';
import { CheckoutPRCommand } from '../../src/commands/pr/checkout.command.js';
import { DiffPRCommand } from '../../src/commands/pr/diff.command.js';
import { ActivityPRCommand } from '../../src/commands/pr/activity.command.js';
import { ListCommentsPRCommand } from '../../src/commands/pr/comments.list.command.js';
import { DeleteCommentPRCommand } from '../../src/commands/pr/comments.delete.command.js';
import { EditCommentPRCommand } from '../../src/commands/pr/comments.edit.command.js';
import { ListReviewersPRCommand } from '../../src/commands/pr/reviewers.list.command.js';
import { AddReviewerPRCommand } from '../../src/commands/pr/reviewers.add.command.js';
import { RemoveReviewerPRCommand } from '../../src/commands/pr/reviewers.remove.command.js';
import { ChecksPRCommand } from '../../src/commands/pr/checks.command.js';
import { CommentPRCommand } from '../../src/commands/pr/comment.command.js';
import {
  createMockOutputService,
  createMockGitService,
  mockPullRequest,
  mockUser,
} from '../setup.js';
import type { IContextService } from '../../src/core/interfaces/services.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';
import type {
  Pullrequest,
  PullrequestComment,
  PullrequestsApi,
  PaginatedPullrequests,
  Participant,
  CommitStatusesApi,
  Commitstatus,
  PaginatedCommitstatuses,
  UsersApi,
} from '../../src/generated/api.js';
import type { AxiosResponse } from 'axios';

// Mock data for diffstat
const mockDiffStat = {
  old: { path: 'README.md', type: 'commit_file' },
  new: { path: 'README.md', type: 'commit_file' },
  lines_added: 1,
  lines_removed: 1,
};

// Mock data for diff
const mockDiff = `diff --git a/README.md b/README.md
index 123456..789abc 100644
--- a/README.md
+++ b/README.md
@@ -1 +1 @@
-Old content
+New content`;

// Helper to create mock AxiosResponse
function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

// Helper to create a Set from an array
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

// Mock PullrequestsApi factory - returns a partial mock that we cast to the full type
function createMockPullrequestsApi(
  options: {
    pullRequests?: Pullrequest[];
    pullRequestPages?: Pullrequest[][];
    activityPages?: Array<Array<Record<string, unknown>>>;
    comments?: PullrequestComment[];
    commentsPages?: PullrequestComment[][];
    throwOnGet?: boolean;
    throwOnList?: boolean;
    throwOnCreate?: boolean;
    throwOnMerge?: boolean;
    throwOnApprove?: boolean;
    throwOnDecline?: boolean;
    throwOnUpdate?: boolean;
    throwOnDiff?: boolean;
    throwOnDiffstat?: boolean;
    throwOnActivity?: boolean;
    throwOnComment?: boolean;
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
    onActivityCall?: (request: unknown, axiosOptions?: unknown) => void;
    onCommentsListCall?: (request: unknown, axiosOptions?: unknown) => void;
  } = {}
): PullrequestsApi & { lastCommentBody?: Record<string, unknown> } {
  const prs = options.pullRequests ?? [mockPullRequest];
  const allPullRequests = options.pullRequestPages
    ? options.pullRequestPages.flat()
    : prs;
  const defaultActivities: Array<Record<string, unknown>> = [
    {
      comment: {
        id: 101,
        content: { raw: 'Looks good to me' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
      },
    },
  ];
  const defaultComments: PullrequestComment[] = [
    {
      id: 1,
      type: 'pullrequest_comment',
      content: { raw: 'Looks good to me' },
      user: mockUser,
      created_on: '2024-01-02T00:00:00.000Z',
      deleted: false,
    } as PullrequestComment,
  ];

  const mockApi = {
    async repositoriesWorkspaceRepoSlugPullrequestsGet(
      request: unknown,
      axiosOptions?: unknown
    ) {
      if (options.throwOnList) {
        throw new Error('API Error');
      }

      options.onListCall?.(request, axiosOptions);

      const { page, pagelen } = extractPaginationParams(axiosOptions);
      let pageValues: Pullrequest[];
      let totalSize: number;
      let hasNext: boolean;

      if (options.pullRequestPages) {
        pageValues = options.pullRequestPages[page - 1] ?? [];
        totalSize = options.pullRequestPages.flat().length;
        hasNext = page < options.pullRequestPages.length;
      } else {
        const start = (page - 1) * pagelen;
        const end = start + pagelen;
        pageValues = prs.slice(start, end);
        totalSize = prs.length;
        hasNext = end < prs.length;
      }

      const paginated: PaginatedPullrequests = {
        values: createSet(pageValues),
        page,
        pagelen,
        size: totalSize,
        next: hasNext
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?page=${page + 1}`
          : undefined,
      };

      return createAxiosResponse(paginated);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnGet) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return createAxiosResponse(pr);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPost(params: {
      body: Pullrequest;
    }) {
      if (options.throwOnCreate) {
        throw new Error('API Error');
      }
      const newPr: Pullrequest = {
        ...mockPullRequest,
        id: 2,
        title: params.body.title ?? 'New PR',
        description: params.body.description,
        draft: params.body.draft ?? false,
        source: params.body.source ?? mockPullRequest.source,
        destination: params.body.destination ?? mockPullRequest.destination,
        close_source_branch: params.body.close_source_branch ?? false,
      };
      return createAxiosResponse(newPr);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnMerge) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return createAxiosResponse({
        ...pr,
        state: 'MERGED' as const,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnApprove) {
        throw new Error('API Error');
      }
      const participant: Participant = {
        type: 'participant',
        approved: true,
        user: mockUser,
        participated_on: '2024-01-01T00:00:00.000Z',
      };
      return createAxiosResponse(participant);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnDecline) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return createAxiosResponse({
        ...pr,
        state: 'DECLINED' as const,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(params: {
      pullRequestId: number;
      body: Pullrequest;
    }) {
      if (options.throwOnUpdate) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return createAxiosResponse({
        ...pr,
        title: params.body.title ?? pr.title,
        description: params.body.description ?? pr.description,
        draft: params.body.draft ?? pr.draft,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnDiff) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      // The API returns void but we return string for testing
      return createAxiosResponse(mockDiff as unknown as void);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnDiffstat) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      // The API returns void but we return data for testing
      return createAxiosResponse({
        values: createSet([
          {
            ...mockDiffStat,
            new: { path: 'src/file.ts', type: 'commit_file' },
          },
          {
            ...mockDiffStat,
            new: { path: 'src/newfile.ts', type: 'commit_file' },
          },
        ]),
        pagelen: 25,
        size: 2,
      } as unknown as void);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet(
      params: {
        pullRequestId: number;
      },
      axiosOptions?: unknown
    ) {
      if (options.throwOnActivity) {
        throw new Error('API Error');
      }

      options.onActivityCall?.(params, axiosOptions);

      const { page, pagelen } = extractPaginationParams(axiosOptions);
      let pageValues: Array<Record<string, unknown>>;
      let totalSize: number;
      let hasNext: boolean;

      if (options.activityPages) {
        pageValues = options.activityPages[page - 1] ?? [];
        totalSize = options.activityPages.flat().length;
        hasNext = page < options.activityPages.length;
      } else {
        const allActivities = defaultActivities;
        const start = (page - 1) * pagelen;
        const end = start + pagelen;
        pageValues = allActivities.slice(start, end);
        totalSize = allActivities.length;
        hasNext = end < allActivities.length;
      }

      // The API returns void but we return data for testing
      return createAxiosResponse({
        values: createSet(pageValues),
        page,
        pagelen,
        size: totalSize,
        next: hasNext
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/${params.pullRequestId}/activity?page=${page + 1}`
          : undefined,
      } as unknown as void);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet(
      params: {
        pullRequestId: number;
      },
      axiosOptions?: unknown
    ) {
      options.onCommentsListCall?.(params, axiosOptions);

      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const allComments = options.comments ?? defaultComments;
      let pageValues: PullrequestComment[];
      let totalSize: number;
      let hasNext: boolean;

      if (options.commentsPages) {
        pageValues = options.commentsPages[page - 1] ?? [];
        totalSize = options.commentsPages.flat().length;
        hasNext = page < options.commentsPages.length;
      } else {
        const start = (page - 1) * pagelen;
        const end = start + pagelen;
        pageValues = allComments.slice(start, end);
        totalSize = allComments.length;
        hasNext = end < allComments.length;
      }

      return createAxiosResponse({
        values: createSet(pageValues),
        page,
        pagelen,
        size: totalSize,
        next: hasNext
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/${params.pullRequestId}/comments?page=${page + 1}`
          : undefined,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      body: Record<string, unknown>;
    }) {
      if (options.throwOnComment) {
        throw new Error('API Error');
      }
      mockApi.lastCommentBody = params.body;
      return createAxiosResponse({
        id: 201,
        type: 'pullrequest_comment',
        content: params.body.content,
        inline: params.body.inline,
      });
    },
  };

  // Return the mock as PullrequestsApi - we only implement the methods we use
  return mockApi as unknown as PullrequestsApi & {
    lastCommentBody?: Record<string, unknown>;
  };
}

function createMockCommitStatusesApi(
  options: {
    statuses?: Commitstatus[];
    throwOnGet?: boolean;
  } = {}
): CommitStatusesApi {
  const statuses = options.statuses ?? [
    {
      type: 'commit_status',
      key: 'build',
      name: 'Build',
      state: 'SUCCESSFUL',
      description: 'All checks passed',
      created_on: '2024-01-01T00:00:00.000Z',
      updated_on: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockApi = {
    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet() {
      if (options.throwOnGet) {
        throw new Error('API Error');
      }

      const paginated: PaginatedCommitstatuses = {
        values: createSet(statuses),
        pagelen: 25,
        size: statuses.length,
      };

      return createAxiosResponse(paginated);
    },
  };

  return mockApi as unknown as CommitStatusesApi;
}

function createMockUsersApi(options: { uuid?: string } = {}): UsersApi {
  const mockApi = {
    async userGet() {
      return createAxiosResponse({
        ...mockUser,
        uuid: options.uuid,
      });
    },
  };

  return mockApi as unknown as UsersApi;
}

function createMockContextService(context?: {
  workspace?: string;
  repoSlug?: string;
}): IContextService {
  return {
    parseRemoteUrl() {
      return null;
    },
    async getRepoContextFromGit() {
      return null;
    },
    async getRepoContext(options) {
      // Options take priority
      if (options?.workspace && options?.repo) {
        return {
          workspace: options.workspace,
          repoSlug: options.repo,
        };
      }
      if (context?.workspace && context?.repoSlug) {
        return {
          workspace: context.workspace,
          repoSlug: context.repoSlug,
        };
      }
      return null;
    },
    async requireRepoContext(options) {
      // Options take priority
      if (options?.workspace && options?.repo) {
        return {
          workspace: options.workspace,
          repoSlug: options.repo,
        };
      }
      if (context?.workspace && context?.repoSlug) {
        return {
          workspace: context.workspace,
          repoSlug: context.repoSlug,
        };
      }
      throw { code: 6001, message: 'No repo context' } as BBError;
    },
  };
}

describe('ListPRsCommand', () => {
  it('should list open pull requests by default', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should filter by state', async () => {
    const prs = [
      { ...mockPullRequest, id: 1, state: 'OPEN' as const },
      { ...mockPullRequest, id: 2, state: 'MERGED' as const },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ state: 'MERGED' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should fail when no repo context', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    await expect(command.run({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should show message when no PRs found', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.includes('No open pull requests found'))
    ).toBe(true);
  });

  it('should label draft pull requests', async () => {
    const prs = [{ ...mockPullRequest, id: 1, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table-rows:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('[DRAFT]'))).toBe(true);
  });

  it('should respect limit option', async () => {
    const prs = [
      { ...mockPullRequest, id: 1, title: 'PR 1' },
      { ...mockPullRequest, id: 2, title: 'PR 2' },
      { ...mockPullRequest, id: 3, title: 'PR 3' },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should output json when requested', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should include reviewer filter when --mine is set', async () => {
    let capturedAxiosOptions: unknown;
    const pullrequestsApi = createMockPullrequestsApi({
      onListCall: (_request, axiosOptions) => {
        capturedAxiosOptions = axiosOptions;
      },
    });
    const usersApi = createMockUsersApi({ uuid: '{my-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ mine: true }, { globalOptions: {} });

    const opts = capturedAxiosOptions as { params: Record<string, unknown> };
    expect(opts.params.q).toBe('reviewers.uuid="{my-uuid}"');
  });

  it('should warn and show all PRs when --mine is set but uuid is missing', async () => {
    let capturedAxiosOptions: unknown;
    const pullrequestsApi = createMockPullrequestsApi({
      onListCall: (_request, axiosOptions) => {
        capturedAxiosOptions = axiosOptions;
      },
    });
    const usersApi = createMockUsersApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ mine: true }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes(
          'Could not determine your user UUID. Showing all pull requests.'
        )
      )
    ).toBe(true);
    const opts = capturedAxiosOptions as { params: Record<string, unknown> };
    expect(opts.params.q).toBeUndefined();
  });
});

describe('ViewPRCommand', () => {
  it('should view pull request by ID', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('#1'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Test PR'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should show draft indicator when PR is draft', async () => {
    const prs = [{ ...mockPullRequest, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('[DRAFT]'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });
});

describe('ActivityPRCommand', () => {
  it('should list activity entries', async () => {
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

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should filter activity by type', async () => {
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
    await command.execute({ id: '1', type: 'approval' }, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.includes('No activity entries matched'))
    ).toBe(true);
  });

  it('should respect limit option', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            comment: {
              id: 1,
              content: { raw: 'Comment 1' },
              user: mockUser,
              created_on: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            comment: {
              id: 2,
              content: { raw: 'Comment 2' },
              user: mockUser,
              created_on: '2024-01-01T01:00:00.000Z',
            },
          },
          {
            comment: {
              id: 3,
              content: { raw: 'Comment 3' },
              user: mockUser,
              created_on: '2024-01-01T02:00:00.000Z',
            },
          },
        ],
      ],
    });
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
    await command.execute({ id: '1', limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should continue paginating when type filter is used', async () => {
    const requestedPages: number[] = [];
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            approval: {
              user: mockUser,
              date: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        [
          {
            comment: {
              id: 10,
              content: { raw: 'Filtered comment' },
              user: mockUser,
              created_on: '2024-01-01T01:00:00.000Z',
            },
          },
        ],
      ],
      onActivityCall: (_request, axiosOptions) => {
        requestedPages.push(extractPaginationParams(axiosOptions).page);
      },
    });
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
    await command.execute(
      { id: '1', type: 'comment', limit: '1' },
      { globalOptions: {} }
    );

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(requestedPages).toEqual([1, 2]);
  });
});

describe('ListCommentsPRCommand', () => {
  it('should list comments with limit', async () => {
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 1' },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 2,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 2' },
        user: mockUser,
        created_on: '2024-01-01T01:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 3,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 3' },
        user: mockUser,
        created_on: '2024-01-01T02:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ comments });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1', limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should include limited count in json output', async () => {
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 1' },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 2,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 2' },
        user: mockUser,
        created_on: '2024-01-01T01:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 3,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 3' },
        user: mockUser,
        created_on: '2024-01-01T02:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ comments });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '1', limit: '2' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.count).toBe(2);
    expect(parsed.comments).toHaveLength(2);
  });
});

describe('ChecksPRCommand', () => {
  it('should list check statuses for a pull request', async () => {
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: 'All checks passed',
          updated_on: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'commit_status',
          key: 'tests',
          name: 'Tests',
          state: 'FAILED',
          description: 'Tests failed',
          updated_on: '2024-01-01T01:00:00.000Z',
        },
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Build'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Tests'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const commitStatusesApi = createMockCommitStatusesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1', json: true }, { globalOptions: {} });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should show info when no checks exist', async () => {
    const commitStatusesApi = createMockCommitStatusesApi({ statuses: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No CI/CD checks found for this pull request')
      )
    ).toBe(true);
  });
});

describe('CreatePRCommand', () => {
  it('should create pull request with title', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Created pull request'))
    ).toBe(true);
  });

  it('should fail when title not provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(command.run({}, { globalOptions: {} })).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('title'))).toBe(true);
  });

  it('should use current branch as source', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'my-feature' });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit source branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'My PR', source: 'explicit-branch' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use main as default destination', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'feature' });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit destination branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'feature' });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'My PR', destination: 'develop' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should create draft pull request when flag is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'feature' });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Draft PR', draft: true },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new CreatePRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'My PR' },
      { globalOptions: { json: true } }
    );

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });
});

describe('MergePRCommand', () => {
  it('should merge pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Merged'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});

describe('ApprovePRCommand', () => {
  it('should approve pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ApprovePRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Approved'))).toBe(true);
  });
});

describe('DeclinePRCommand', () => {
  it('should decline pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeclinePRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Declined'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeclinePRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});

describe('ReadyPRCommand', () => {
  it('should mark pull request as ready', async () => {
    const prs = [{ ...mockPullRequest, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ReadyPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('ready for review'))).toBe(
      true
    );
  });
});

describe('CheckoutPRCommand', () => {
  it('should checkout pull request branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ isRepo: true });
    const output = createMockOutputService();

    const command = new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ isRepo: true });
    const output = createMockOutputService();

    const command = new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});

describe('DiffPRCommand', () => {
  it('should display full diff by ID', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  it('should display diff for current branch when no ID provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  it('should auto-detect PR across paginated results', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequestPages: [
        [
          {
            ...mockPullRequest,
            id: 100,
            source: {
              branch: { name: 'other-branch' },
            },
          } as Pullrequest,
        ],
        [
          {
            ...mockPullRequest,
            id: 101,
            source: {
              branch: { name: 'feature-branch' },
            },
          } as Pullrequest,
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  it('should fail when no ID provided and branch not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'other-branch' });
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should display diffstat when --stat flag is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', stat: true }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('files changed'))).toBe(true);
  });

  it('should display file names only when --name-only flag is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', nameOnly: true }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('src/file.ts'))).toBe(true);
    expect(output.logs.some((log) => log.includes('src/newfile.ts'))).toBe(
      true
    );
  });

  it('should return web diff URL in JSON when --web is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', web: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('web');
    expect(parsed.url).toBe(
      'https://bitbucket.org/workspace/repo/pull-requests/1/diff'
    );
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});

describe('EditPRCommand', () => {
  it('should update PR title', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', title: 'New Title' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Updated'))).toBe(true);
  });

  it('should update PR body', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', body: 'New description' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should auto-detect PR from current branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Updated via auto-detect' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should auto-detect PR across paginated results', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequestPages: [
        [
          {
            ...mockPullRequest,
            id: 50,
            source: {
              branch: { name: 'other-branch' },
            },
          } as Pullrequest,
        ],
        [
          {
            ...mockPullRequest,
            id: 51,
            source: {
              branch: { name: 'feature-branch' },
            },
          } as Pullrequest,
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Updated via paginated auto-detect' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail when no changes provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ id: '1' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('At least one of'))).toBe(
      true
    );
  });

  it('should fail when PR not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when no repo context', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '1', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when auto-detect finds no matching PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'other-branch' });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(
      output.logs.some((log) => log.includes('No open pull request found'))
    ).toBe(true);
  });
});

describe('CommentPRCommand', () => {
  // US4: Backward compatibility — general comments work unchanged
  it('should post general comment successfully without inline flags', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Looks good!' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Added comment to pull request'))
    ).toBe(true);
  });

  it('should output general comment JSON without inline key', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Looks good!' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.comment).toBeDefined();
    expect(parsed.inline).toBeUndefined();
  });

  // US3: Validation — invalid flag combinations
  it('should throw when --line-to is used without --file', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', lineTo: '15' },
        { globalOptions: {} }
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toBe(
        '--file is required when using --line-to or --line-from'
      );
    }
  });

  it('should throw when --line-from is used without --file', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', lineFrom: '10' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toBe(
        '--file is required when using --line-to or --line-from'
      );
    }
  });

  it('should throw when --file is used without --line-to or --line-from', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toBe(
        'At least one of --line-to or --line-from is required when using --file'
      );
    }
  });

  it('should throw when --line-to is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: 'abc' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toBe(
        '--line-to must be a positive integer'
      );
    }
  });

  it('should throw when --line-to is zero', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '0' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toBe(
        '--line-to must be a positive integer'
      );
    }
  });

  it('should throw when --line-from is negative', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineFrom: '-1' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toBe(
        '--line-from must be a positive integer'
      );
    }
  });

  // US1: Inline comment with --file and --line-to
  it('should post inline comment with --file and --line-to', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/app.ts', to: 15 });
  });

  it('should show inline success message with file and line', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added inline comment on src/app.ts:15 to pull request')
      )
    ).toBe(true);
  });

  it('should output inline comment JSON with inline key', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.comment).toBeDefined();
    expect(parsed.inline).toEqual({ path: 'src/app.ts', to: 15 });
  });

  // US2: Inline comment with --line-from only
  it('should post inline comment with --file and --line-from only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Why removed?', file: 'src/old.ts', lineFrom: '10' },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/old.ts', from: 10 });
  });

  // US2: Inline comment with both --line-to and --line-from
  it('should post inline comment with --file, --line-to, and --line-from', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      {
        id: '42',
        message: 'This refactor looks good',
        file: 'src/app.ts',
        lineTo: '20',
        lineFrom: '15',
      },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/app.ts', to: 20, from: 15 });
  });

  // US2: Success message for --line-from only
  it('should show old line in success message for --line-from only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Why removed?', file: 'src/old.ts', lineFrom: '10' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes(
          'Added inline comment on src/old.ts (old line 10) to pull request'
        )
      )
    ).toBe(true);
  });
});

describe('ListCommentsPRCommand validation', () => {
  it('should throw when --id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute({ id: 'abc' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('DeleteCommentPRCommand validation', () => {
  it('should throw when --pr-id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { prId: 'abc', commentId: '1' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });

  it('should throw when --comment-id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { prId: '1', commentId: 'xyz' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('EditCommentPRCommand validation', () => {
  it('should throw when --pr-id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { prId: 'abc', commentId: '1', message: 'updated' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });

  it('should throw when --comment-id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { prId: '1', commentId: 'xyz', message: 'updated' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('ListReviewersPRCommand validation', () => {
  it('should throw when --id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute({ id: 'abc' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('AddReviewerPRCommand validation', () => {
  it('should throw when --id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: 'abc', username: 'user1' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('RemoveReviewerPRCommand validation', () => {
  it('should throw when --id is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: 'abc', username: 'user1' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    }
  });
});

describe('ListPRsCommand validation', () => {
  it('should throw when --state is invalid', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    try {
      await command.execute({ state: 'INVALID' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toContain('--state must be one of');
    }
  });

  it('should default to OPEN when --state is not provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    await command.execute({}, { globalOptions: {} });

    // Should not throw - defaults to OPEN
    expect(output.logs.length).toBeGreaterThan(0);
  });
});
