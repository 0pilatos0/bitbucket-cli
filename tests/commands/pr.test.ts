/**
 * PR command tests
 */

import { describe, it, expect, mock } from 'bun:test';
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
import { ResolveCommentPRCommand } from '../../src/commands/pr/comments.resolve.command.js';
import { UnresolveCommentPRCommand } from '../../src/commands/pr/comments.unresolve.command.js';
import { ViewCommentPRCommand } from '../../src/commands/pr/comments.view.command.js';
import { ReplyCommentPRCommand } from '../../src/commands/pr/comments.reply.command.js';
import { ListReviewersPRCommand } from '../../src/commands/pr/reviewers.list.command.js';
import { AddReviewerPRCommand } from '../../src/commands/pr/reviewers.add.command.js';
import { RemoveReviewerPRCommand } from '../../src/commands/pr/reviewers.remove.command.js';
import { ChecksPRCommand } from '../../src/commands/pr/checks.command.js';
import { CommentPRCommand } from '../../src/commands/pr/comment.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
  mockPullRequest,
  mockUser,
} from '../setup.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
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
    comment?: PullrequestComment;
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
    throwOnCommentDelete?: boolean;
    throwOnCommentEdit?: boolean;
    throwOnCommentResolve?: boolean;
    throwOnCommentUnresolve?: boolean;
    throwOnCommentGet?: boolean;
    commentGetError?: unknown;
    commentResolveError?: unknown;
    commentUnresolveError?: unknown;
    commentPostError?: unknown;
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
    onActivityCall?: (request: unknown, axiosOptions?: unknown) => void;
    onCommentsListCall?: (request: unknown, axiosOptions?: unknown) => void;
  } = {}
): PullrequestsApi & {
  lastCommentBody?: Record<string, unknown>;
  lastCommentRequest?: Record<string, unknown>;
  lastCommentEditBody?: Record<string, unknown>;
  lastResolveRequest?: Record<string, unknown>;
  lastResolveOptions?: Record<string, unknown>;
  lastUnresolveRequest?: Record<string, unknown>;
  lastCommentGetRequest?: Record<string, unknown>;
} {
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
      pullrequest: Pullrequest;
    }) {
      if (options.throwOnCreate) {
        throw new Error('API Error');
      }
      const body = params.pullrequest;
      const newPr: Pullrequest = {
        ...mockPullRequest,
        id: 2,
        title: body.title ?? 'New PR',
        description: body.description,
        draft: body.draft ?? false,
        source: body.source ?? mockPullRequest.source,
        destination: body.destination ?? mockPullRequest.destination,
        close_source_branch: body.close_source_branch ?? false,
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
      pullrequest: Pullrequest;
    }) {
      if (options.throwOnUpdate) {
        throw new Error('API Error');
      }
      const pr = allPullRequests.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      const body = params.pullrequest;
      return createAxiosResponse({
        ...pr,
        title: body.title ?? pr.title,
        description: body.description ?? pr.description,
        draft: body.draft ?? pr.draft,
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
      pullrequestComment: Record<string, unknown>;
    }) {
      if (options.commentPostError !== undefined) {
        throw options.commentPostError;
      }
      if (options.throwOnComment) {
        throw new Error('API Error');
      }
      const body = params.pullrequestComment;
      mockApi.lastCommentBody = body;
      mockApi.lastCommentRequest = params;
      return createAxiosResponse({
        id: 201,
        type: 'pullrequest_comment',
        content: body.content,
        inline: body.inline,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete(_params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      commentId: number;
    }) {
      if (options.throwOnCommentDelete) {
        throw new Error('API Error');
      }
      return createAxiosResponse(undefined);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      commentId: number;
      pullrequestComment: Record<string, unknown>;
    }) {
      mockApi.lastCommentEditBody = params.pullrequestComment;
      if (options.throwOnCommentEdit) {
        throw new Error('API Error');
      }
      return createAxiosResponse({
        id: params.commentId,
        type: 'pullrequest_comment',
        content: params.pullrequestComment.content,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost(
      params: {
        workspace: string;
        repoSlug: string;
        pullRequestId: number;
        commentId: number;
      },
      axiosOptions?: Record<string, unknown>
    ) {
      if (options.commentResolveError !== undefined) {
        throw options.commentResolveError;
      }
      if (options.throwOnCommentResolve) {
        throw new Error('API Error');
      }
      mockApi.lastResolveRequest = params;
      mockApi.lastResolveOptions = axiosOptions;
      return createAxiosResponse({
        type: 'comment_resolution',
        user: mockUser,
        created_on: '2024-01-03T00:00:00.000Z',
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolveDelete(params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      commentId: number;
    }) {
      if (options.commentUnresolveError !== undefined) {
        throw options.commentUnresolveError;
      }
      if (options.throwOnCommentUnresolve) {
        throw new Error('API Error');
      }
      mockApi.lastUnresolveRequest = params;
      return createAxiosResponse(undefined);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet(params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      commentId: number;
    }) {
      if (options.commentGetError !== undefined) {
        throw options.commentGetError;
      }
      if (options.throwOnCommentGet) {
        throw new Error('API Error');
      }
      mockApi.lastCommentGetRequest = params;
      return createAxiosResponse(
        options.comment ??
          ({
            id: params.commentId,
            type: 'pullrequest_comment',
            content: { raw: 'Looks good to me' },
            user: mockUser,
            created_on: '2024-01-02T00:00:00.000Z',
            deleted: false,
          } as PullrequestComment)
      );
    },
  };

  // Return the mock as PullrequestsApi - we only implement the methods we use
  return mockApi as unknown as PullrequestsApi & {
    lastCommentBody?: Record<string, unknown>;
    lastCommentRequest?: Record<string, unknown>;
    lastCommentEditBody?: Record<string, unknown>;
    lastResolveRequest?: Record<string, unknown>;
    lastResolveOptions?: Record<string, unknown>;
    lastUnresolveRequest?: Record<string, unknown>;
    lastCommentGetRequest?: Record<string, unknown>;
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

function createMockUsersApi(
  options: { uuid?: string; throwOnGetUser?: boolean } = {}
): UsersApi {
  const mockApi = {
    async userGet() {
      return createAxiosResponse({
        ...mockUser,
        uuid: options.uuid,
      });
    },
    async usersSelectedUserGet(_params: { selectedUser: string }) {
      if (options.throwOnGetUser) {
        throw new Error('User not found');
      }
      return createAxiosResponse({
        ...mockUser,
        uuid: options.uuid ?? '{user-uuid}',
      });
    },
  };

  return mockApi as unknown as UsersApi;
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

    expect(output.logs).toContain('info:No open pull requests found');
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

  it('should truncate long titles by default', async () => {
    const longTitle = 'A'.repeat(80);
    const prs = [{ ...mockPullRequest, id: 1, title: longTitle }];
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

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[1]).toBe('A'.repeat(47) + '...');
  });

  it('should show full titles when noTruncate is set', async () => {
    const longTitle = 'A'.repeat(80);
    const prs = [{ ...mockPullRequest, id: 1, title: longTitle }];
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
    await command.execute({}, { globalOptions: { noTruncate: true } });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[1]).toBe(longTitle);
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

  it('should use ASCII arrow in branch column when noUnicode mode is on', async () => {
    const prs = [
      {
        ...mockPullRequest,
        id: 1,
        source: {
          branch: { name: 'feature' },
        } as unknown as import('../../src/generated/api.js').PullrequestSource,
        destination: {
          branch: { name: 'main' },
        } as unknown as import('../../src/generated/api.js').PullrequestDestination,
      },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService({ noUnicode: true });
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('feature -> main');
  });

  it('should use Unicode arrow in branch column by default', async () => {
    const prs = [
      {
        ...mockPullRequest,
        id: 1,
        source: {
          branch: { name: 'feature' },
        } as unknown as import('../../src/generated/api.js').PullrequestSource,
        destination: {
          branch: { name: 'main' },
        } as unknown as import('../../src/generated/api.js').PullrequestDestination,
      },
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
    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('feature → main');
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

  it('should reject a non-integer --id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should render "No reviewers assigned" when there are no reviewer participants', async () => {
    const prs = [{ ...mockPullRequest, participants: [] } as Pullrequest];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs).toContain('info:No reviewers assigned');
  });

  it('should render approved, changes requested, and pending reviewer statuses', async () => {
    const prs = [
      {
        ...mockPullRequest,
        participants: [
          {
            role: 'REVIEWER',
            approved: true,
            user: { display_name: 'Alice Approver' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            state: 'changes_requested',
            user: { display_name: 'Bob Blocker' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            user: { display_name: 'Carol Pending' },
          },
          // Non-reviewer participant should be filtered out.
          {
            role: 'PARTICIPANT',
            approved: false,
            user: { display_name: 'Dan Drive-by' },
          },
        ],
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Alice Approver');
    expect(joined).toContain('approved');
    expect(joined).toContain('Bob Blocker');
    expect(joined).toContain('changes requested');
    expect(joined).toContain('Carol Pending');
    expect(joined).toContain('pending');
    expect(joined).not.toContain('Dan Drive-by');
  });

  it('should fall back to ASCII separators, arrows, and reviewer icons under noUnicode', async () => {
    const prs = [
      {
        ...mockPullRequest,
        participants: [
          {
            role: 'REVIEWER',
            approved: true,
            user: { display_name: 'Alice Approver' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            state: 'changes_requested',
            user: { display_name: 'Bob Blocker' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            user: { display_name: 'Carol Pending' },
          },
        ],
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService({ noUnicode: true });

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    // No unicode glyphs.
    expect(joined).not.toContain('─');
    expect(joined).not.toContain('→');
    expect(joined).not.toContain('○');
    expect(joined).not.toContain('✓');
    expect(joined).not.toContain('✗');
    // ASCII fallbacks come through.
    expect(joined).toContain('->');
    expect(joined).toContain('[OK]'); // approved
    expect(joined).toContain('[X]'); // changes requested
    expect(joined).toContain('[ ]'); // pending
  });

  it('should render merge commit hash when PR is merged', async () => {
    const prs = [
      {
        ...mockPullRequest,
        state: 'MERGED' as const,
        merge_commit: { hash: '1234567abcdef' },
        closed_by: { ...mockUser, display_name: 'Mergebot' },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('1234567');
    expect(joined).toContain('Merged:');
    expect(joined).toContain('Mergebot');
  });

  it('should render "Closed" label when state is DECLINED and closed_by is present', async () => {
    const prs = [
      {
        ...mockPullRequest,
        state: 'DECLINED' as const,
        closed_by: { ...mockUser, display_name: 'Decliner' },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Closed:');
    expect(joined).toContain('Decliner');
  });

  it('should show "unknown" placeholder when branch info is missing', async () => {
    const prs = [
      {
        ...mockPullRequest,
        source: {} as unknown as typeof mockPullRequest.source,
        destination: {} as unknown as typeof mockPullRequest.destination,
      } as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Branch:');
    expect(joined).toContain('unknown');
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

  it('should reject a non-integer --id', async () => {
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

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should truncate long comment activity by default', async () => {
    const longContent = 'D'.repeat(120);
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            comment: {
              id: 99,
              content: { raw: longContent },
              user: mockUser,
              created_on: '2024-01-01T00:00:00.000Z',
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
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('#99 ' + 'D'.repeat(77) + '...');
  });

  it('should show full comment activity when noTruncate is set', async () => {
    const longContent = 'D'.repeat(120);
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            comment: {
              id: 99,
              content: { raw: longContent },
              user: mockUser,
              created_on: '2024-01-01T00:00:00.000Z',
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
    await command.execute({ id: '1' }, { globalOptions: { noTruncate: true } });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('#99 ' + longContent);
  });

  it('should reject an invalid --type value', async () => {
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

    await expect(
      command.execute({ id: '1', type: 'commetn' }, { globalOptions: {} })
    ).rejects.toThrow(/--type must be one of/);
  });

  it('should use changes_requested actor when both changes_requested and update are set', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
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
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0][1]).toBe('CR User');
    expect(rows[0][2]).toContain('2024-03-01');
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

  it('should truncate long comment content by default', async () => {
    const longContent = 'B'.repeat(120);
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: longContent },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
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
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe('B'.repeat(57) + '...');
  });

  it('should show full comment content when noTruncate is set', async () => {
    const longContent = 'B'.repeat(120);
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: longContent },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
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
    await command.execute({ id: '1' }, { globalOptions: { noTruncate: true } });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe(longContent);
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
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

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

  it('should truncate long check descriptions by default', async () => {
    const longDescription = 'C'.repeat(80);
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: longDescription,
          updated_on: '2024-01-01T00:00:00.000Z',
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

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe('C'.repeat(37) + '...');
  });

  it('should show full check descriptions when noTruncate is set', async () => {
    const longDescription = 'C'.repeat(80);
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: longDescription,
          updated_on: '2024-01-01T00:00:00.000Z',
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
    await command.execute({ id: '1' }, { globalOptions: { noTruncate: true } });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe(longDescription);
  });
});

import type { DefaultReviewerEntry } from '../../src/services/default-reviewer.service.js';
import type { DefaultReviewerService } from '../../src/services/default-reviewer.service.js';
import type { IConfigService } from '../../src/core/interfaces/services.js';
import { createMockConfigService } from '../setup.js';

function createMockDefaultReviewerService(
  entries: DefaultReviewerEntry[] = [],
  throwOnList = false
): DefaultReviewerService {
  const svc = {
    async list() {
      if (throwOnList) {
        throw new Error('effective reviewers fetch failed');
      }
      return entries;
    },
    async add() {
      return entries[0] ?? { uuid: '{}' };
    },
    async remove() {
      // not used
    },
  };
  return svc as unknown as DefaultReviewerService;
}

interface CreatePRHarnessOptions {
  currentBranch?: string;
  defaultReviewers?: DefaultReviewerEntry[];
  defaultReviewersThrow?: boolean;
  authorUuid?: string;
  config?: Parameters<typeof createMockConfigService>[0];
  capturedBodyRef?: { body?: import('../../src/generated/api.js').Pullrequest };
  createPRThrows?: boolean;
}

function buildCreatePRCommand(options: CreatePRHarnessOptions = {}): {
  command: CreatePRCommand;
  output: ReturnType<typeof createMockOutputService>;
  captured: { body?: import('../../src/generated/api.js').Pullrequest };
} {
  const captured: {
    body?: import('../../src/generated/api.js').Pullrequest;
  } = options.capturedBodyRef ?? {};

  const basePullrequestsApi = createMockPullrequestsApi();
  // Wrap POST so we can inspect the body on assertions.
  const originalPost =
    basePullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPost.bind(
      basePullrequestsApi
    );
  const pullrequestsApi = basePullrequestsApi as typeof basePullrequestsApi & {
    repositoriesWorkspaceRepoSlugPullrequestsPost: (params: {
      workspace: string;
      repoSlug: string;
      pullrequest: import('../../src/generated/api.js').Pullrequest;
    }) => Promise<
      AxiosResponse<import('../../src/generated/api.js').Pullrequest>
    >;
  };
  pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPost = async (
    params
  ) => {
    captured.body = params.pullrequest;
    if (options.createPRThrows) {
      throw new Error('PR creation failed');
    }
    return originalPost(params);
  };

  const authorUuid = options.authorUuid ?? '{author-uuid}';
  const usersApi = {
    async userGet() {
      return {
        data: { ...mockUser, uuid: authorUuid },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };
    },
    async usersSelectedUserGet(params: { selectedUser: string }) {
      return {
        data: {
          ...mockUser,
          uuid: `{${params.selectedUser}-uuid}`,
          display_name: `Display ${params.selectedUser}`,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };
    },
  } as unknown as UsersApi;

  const contextService = createMockContextService({
    workspace: 'workspace',
    repoSlug: 'repo',
  });

  const gitService = createMockGitService({
    currentBranch: options.currentBranch ?? 'feature-branch',
  });

  const defaultReviewerService = createMockDefaultReviewerService(
    options.defaultReviewers,
    options.defaultReviewersThrow
  );

  const configService: IConfigService = createMockConfigService(
    options.config ?? {}
  );

  const output = createMockOutputService();

  const command = new CreatePRCommand(
    pullrequestsApi,
    usersApi,
    contextService,
    gitService,
    defaultReviewerService,
    configService,
    output
  );

  return { command, output, captured };
}

describe('CreatePRCommand', () => {
  it('should create pull request with title', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Created pull request'))
    ).toBe(true);
  });

  it('should fail when title not provided', async () => {
    const { command, output } = buildCreatePRCommand();
    await expect(command.run({}, { globalOptions: {} })).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('title'))).toBe(true);
  });

  it('should use current branch as source', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'my-feature',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit source branch', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute(
      { title: 'My PR', source: 'explicit-branch' },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use main as default destination', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit destination branch', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute(
      { title: 'My PR', destination: 'develop' },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should create draft pull request when flag is set', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute(
      { title: 'Draft PR', draft: true },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute(
      { title: 'My PR' },
      { globalOptions: { json: true } }
    );
    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should not include reviewers by default', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{r1}', displayName: 'R One' },
        { uuid: '{r2}', displayName: 'R Two' },
      ],
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(captured.body?.reviewers).toBeUndefined();
  });

  it('should include default reviewers when --default-reviewers is set', async () => {
    const { command, captured, output } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{r1}', displayName: 'R One' },
        { uuid: '{r2}', displayName: 'R Two' },
      ],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}', '{r2}']);
    expect(output.logs.some((log) => log.includes('Reviewers:'))).toBe(true);
  });

  it('should include explicit --reviewer values and dedupe with defaults', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      {
        title: 'My PR',
        defaultReviewers: true,
        reviewer: ['r1', 'r3'],
      },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    // Default {r1} + explicit {r1-uuid} + explicit {r3-uuid}, de-duped
    expect(uuids).toContain('{r1}');
    expect(uuids).toContain('{r1-uuid}');
    expect(uuids).toContain('{r3-uuid}');
  });

  it('should filter out the author from the reviewer list', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{author-uuid}', displayName: 'Me' },
        { uuid: '{r1}', displayName: 'R One' },
      ],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}']);
  });

  it('should respect --no-default-reviewers even when config enables it', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      config: { prCreateIncludeDefaultReviewers: true },
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: false },
      { globalOptions: {} }
    );
    expect(captured.body?.reviewers).toBeUndefined();
  });

  it('should include defaults when config enables it and no flag is passed', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      config: { prCreateIncludeDefaultReviewers: true },
      authorUuid: '{author-uuid}',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}']);
  });

  it('should warn and continue when the default-reviewer fetch fails', async () => {
    const { command, captured, output } = buildCreatePRCommand({
      defaultReviewersThrow: true,
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    expect(captured.body?.reviewers).toBeUndefined();
    expect(
      output.logs.some(
        (log) => log.startsWith('warning:') && log.includes('default reviewers')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should run a spinner for the duration of the API call', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    const startIdx = output.logs.findIndex((log) =>
      log.startsWith('spinner-start:Creating pull request')
    );
    const stopIdx = output.logs.findIndex((log) => log === 'spinner-stop');
    const successIdx = output.logs.findIndex((log) =>
      log.startsWith('success:')
    );

    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(stopIdx).toBeGreaterThan(startIdx);
    expect(successIdx).toBeGreaterThan(stopIdx);
  });

  it('should stop the spinner even when the API call fails', async () => {
    const { command, output } = buildCreatePRCommand({
      createPRThrows: true,
    });

    await expect(
      command.execute({ title: 'My PR' }, { globalOptions: {} })
    ).rejects.toThrow();

    expect(output.logs.some((log) => log.startsWith('spinner-start:'))).toBe(
      true
    );
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
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

  it('should reject an invalid --strategy value', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: '1', strategy: 'bogus' }, { globalOptions: {} })
    ).rejects.toThrow(/--strategy must be one of/);
  });

  it('should accept a valid --strategy value', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute(
      { id: '1', strategy: 'squash' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('Merged'))).toBe(true);
  });

  it('should reject a non-integer --id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should run a spinner labeled with the PR id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('spinner-start:Merging pull request #1')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
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

  it('should reject a non-integer PR ID with VALIDATION_INVALID', async () => {
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

    try {
      await command.execute({ id: 'abc' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(BBError);
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(err.context).toEqual({ id: 'abc' });
    }
  });

  it('should emit diffstat JSON including totals when --stat --json', async () => {
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
      { id: '1', stat: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('stat');
    expect(parsed.pullRequestId).toBe(1);
    expect(parsed.files).toHaveLength(2);
    expect(parsed.filesChanged).toBe(2);
    expect(parsed.totalAdditions).toBe(2);
    expect(parsed.totalDeletions).toBe(2);
  });

  it('should emit name-only JSON with the list of file paths', async () => {
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
      { id: '1', nameOnly: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('name-only');
    expect(parsed.files).toEqual(['src/file.ts', 'src/newfile.ts']);
  });

  it('should emit diff JSON with the raw diff string', async () => {
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
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('diff');
    expect(parsed.diff).toContain('diff --git');
    expect(parsed.diff).toContain('-Old content');
    expect(parsed.diff).toContain('+New content');
  });

  it('should render a summary line with file/addition/deletion counts in stat mode', async () => {
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

    const summary = output.logs.find((log) => log.includes('files changed'));
    expect(summary).toBeDefined();
    expect(summary).toContain('2 files changed');
    expect(summary).toContain('insertions');
    expect(summary).toContain('deletions');
  });

  it('should use singular "file changed" for a single-file stat', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    // Override diffstat to return only one file.
    (
      pullrequestsApi as any
    ).repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet =
      async () =>
        ({
          data: {
            values: new Set([
              {
                new: { path: 'only.ts' },
                lines_added: 1,
                lines_removed: 0,
              },
            ]),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }) as any;

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

    const summary = output.logs.find((log) => log.includes('file changed'));
    expect(summary).toBeDefined();
    expect(summary).toContain('1 file changed');
  });

  it('should pass the URL verbatim to open() without shell interpolation when --web is set', async () => {
    const openCalls: string[] = [];
    mock.module('open', () => ({
      default: async (url: string) => {
        openCalls.push(url);
      },
    }));

    const maliciousUrl =
      'https://bitbucket.org/workspace/repo/pull-requests/1/?x=" & echo pwned `id`';
    const prs = [
      {
        ...mockPullRequest,
        links: { html: { href: maliciousUrl } },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
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
    await command.execute({ id: '1', web: true }, { globalOptions: {} });

    expect(openCalls).toHaveLength(1);
    expect(openCalls[0]).toBe(`${maliciousUrl}/diff`);
  });

  it('should use the PR html link when building a --web URL', async () => {
    const prs = [
      {
        ...mockPullRequest,
        links: {
          html: {
            href: 'https://bitbucket.org/workspace/repo/pull-requests/1/',
          },
        },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
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
    const parsed = JSON.parse(jsonLog!.substring(5));
    // Trailing slash stripped, /diff appended.
    expect(parsed.url).toBe(
      'https://bitbucket.org/workspace/repo/pull-requests/1/diff'
    );
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
      expect((error as BBError).message).toContain(
        '--file is required when using --line-to or --line-from'
      );
      expect((error as BBError).message).toContain('Valid modes:');
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
      expect((error as BBError).message).toContain(
        '--file is required when using --line-to or --line-from'
      );
      expect((error as BBError).message).toContain('Valid modes:');
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
      expect((error as BBError).message).toContain(
        'At least one of --line-to or --line-from is required when using --file'
      );
      expect((error as BBError).message).toContain('Valid modes:');
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
      expect((error as BBError).message).toMatch(
        /^--line-to must be a positive integer\./
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
      expect((error as BBError).message).toMatch(
        /^--line-to must be a positive integer\./
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
      expect((error as BBError).message).toMatch(
        /^--line-from must be a positive integer\./
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

// ============================================================
// DeleteCommentPRCommand tests
// ============================================================

describe('DeleteCommentPRCommand', () => {
  it('should delete a comment and show success message', async () => {
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
    await command.execute(
      { prId: '42', commentId: '7', yes: true },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Deleted comment #7 from PR #42'))
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
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
    await command.execute(
      { prId: '42', commentId: '7', yes: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
  });

  it('should propagate API error on delete failure', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentDelete: true,
    });
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

    await expect(
      command.execute(
        { prId: '42', commentId: '7', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
  });

  it('should throw when no repo context available', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });

  it('should throw without --yes flag', async () => {
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

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm');
  });
});

// ============================================================
// EditCommentPRCommand tests
// ============================================================

describe('EditCommentPRCommand', () => {
  it('should edit a comment and show success message', async () => {
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
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Updated comment #7 on PR #42'))
    ).toBe(true);
  });

  // Bitbucket rejects `type` on the comment payload with 400 "extra keys not
  // allowed", so the update body must carry content only.
  it('should send only content, without type', async () => {
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
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: {} }
    );

    const body = pullrequestsApi.lastCommentEditBody as
      | Record<string, unknown>
      | undefined;
    expect(body).toEqual({ content: { raw: 'Updated text' } });
  });

  it('should return JSON on success', async () => {
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
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
    expect(parsed.comment).toBeDefined();
  });

  it('should propagate API error on edit failure', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentEdit: true,
    });
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

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Updated text' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
  });

  it('should throw when no repo context available', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Updated text' },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });
});

// ============================================================
// ResolveCommentPRCommand tests
// ============================================================

describe('ResolveCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ResolveCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should resolve a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Resolved comment #7 on PR #42');
    expect(pullrequestsApi.lastResolveRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should send an empty body, which Bitbucket requires on this POST', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastResolveOptions).toEqual({
      data: {},
    });
  });

  it('should return JSON with the resolution payload', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
    expect(parsed.resolution.type).toBe('comment_resolution');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should throw when pr-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: 'abc', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('--pr-id must be a positive integer.');
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    try {
      await command.execute(
        { prId: '42', commentId: '0' },
        { globalOptions: {} }
      );
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toContain(
        '--comment-id must be a positive integer.'
      );
    }
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should propagate API errors without emitting a success line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentResolve: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });
  it('should wrap a 404 with a not-found message naming the location', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentResolveError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});

// ============================================================
// UnresolveCommentPRCommand tests
// ============================================================

describe('UnresolveCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new UnresolveCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should unresolve a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Unresolved comment #7 on PR #42');
    expect(pullrequestsApi.lastUnresolveRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should return JSON with identifiers only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    expect(JSON.parse(jsonLog!.substring(5))).toEqual({
      success: true,
      pullRequestId: 42,
      commentId: 7,
    });
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should throw when pr-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: 'abc', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('--pr-id must be a positive integer.');
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: '42', commentId: '0' }, { globalOptions: {} })
    ).rejects.toThrow('--comment-id must be a positive integer.');
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should propagate API errors without emitting a success line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentUnresolve: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });
  it('should wrap a 404 with a not-found message naming the location', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentUnresolveError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});

// ============================================================
// ViewCommentPRCommand tests
// ============================================================

describe('ViewCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ViewCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should render a detail block for the comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('#7');
    expect(text).toContain('Test User');
    expect(text).toContain('Looks good to me');
    expect(text).toContain('unresolved');
    expect(pullrequestsApi.lastCommentGetRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should report a resolved thread when resolution is present', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'Nit: rename this' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        resolution: {
          type: 'comment_resolution',
          user: mockUser,
          created_on: '2024-01-03T00:00:00.000Z',
        },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[resolved]');
    expect(text).not.toContain('[unresolved]');
  });

  it('should render [deleted] for a deleted comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'gone' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        deleted: true,
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[deleted]');
    expect(text).not.toContain('gone');
  });

  it('should output the raw comment object as JSON', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.id).toBe(7);
    expect(parsed.type).toBe('pullrequest_comment');
    expect(parsed.content.raw).toBe('Looks good to me');
    expect(output.logs.filter((log) => log.startsWith('text:'))).toHaveLength(
      0
    );
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: '42', commentId: '0' }, { globalOptions: {} })
    ).rejects.toThrow('--comment-id must be a positive integer.');
  });

  it('should wrap a 404 with a not-found message naming the comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentGetError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });

  it('should propagate non-404 API errors', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentGet: true,
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
  it('should render [pending] for an unpublished draft comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'draft note' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        pending: true,
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[pending]');
    expect(text).not.toContain('[unresolved]');
  });

  it('should render [no content] when the comment body is empty', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('[no content]');
  });
});

// ============================================================
// ReplyCommentPRCommand tests
// ============================================================

describe('ReplyCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ReplyCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should post a reply carrying the parent id and show success', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Replied to comment #7 on PR #42');
    const body = pullrequestsApi.lastCommentBody as
      | Record<string, unknown>
      | undefined;
    expect(body?.parent).toEqual({ id: 7 });
    expect(body?.content).toEqual({ raw: 'Agreed' });
  });

  // Bitbucket rejects `type` on the comment payload and on `parent` with
  // 400 "extra keys not allowed", so the body must carry neither.
  it('should omit type from the payload and from parent', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    const body = pullrequestsApi.lastCommentBody as
      | Record<string, unknown>
      | undefined;
    expect(body).not.toHaveProperty('type');
    expect(Object.keys(body ?? {}).sort()).toEqual(['content', 'parent']);
    expect(body?.parent).not.toHaveProperty('type');
  });

  it('should address the reply to the resolved workspace, repo and PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    const request = pullrequestsApi.lastCommentRequest as
      | Record<string, unknown>
      | undefined;
    expect(request?.workspace).toBe('workspace');
    expect(request?.repoSlug).toBe('repo');
    expect(request?.pullRequestId).toBe(42);
  });

  it('should return JSON with the created comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.parentId).toBe(7);
    expect(parsed.comment.id).toBe(201);
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should throw when pr-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute(
        { prId: 'abc', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--pr-id must be a positive integer.');
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute(
        { prId: '42', commentId: '0', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--comment-id must be a positive integer.');
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });

  it('should propagate API errors without emitting a success line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnComment: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should wrap a 404 with a not-found message naming the parent', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentPostError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});

// ============================================================
// ListReviewersPRCommand tests
// ============================================================

describe('ListReviewersPRCommand', () => {
  it('should display reviewers in a table', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { display_name: 'Alice', account_id: 'acc-1' },
        { display_name: 'Bob', account_id: 'acc-2' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
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
    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(2);
  });

  it('should show info message when no reviewers', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
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
    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No reviewers assigned to this pull request')
      )
    ).toBe(true);
  });

  it('should return JSON with reviewers', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { display_name: 'Alice', account_id: 'acc-1' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
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
    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.count).toBe(1);
    expect(parsed.reviewers).toHaveLength(1);
  });

  it('should return JSON with empty reviewers', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
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
    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.count).toBe(0);
    expect(parsed.reviewers).toHaveLength(0);
  });

  it('should handle reviewers with missing fields', async () => {
    const prWithPartialReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([{ type: 'user' }]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithPartialReviewers],
    });
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
    await command.execute({ id: '42' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
    expect(rows[0][0]).toBe('Unknown');
    expect(rows[0][1]).toBe('');
  });
});

// ============================================================
// AddReviewerPRCommand tests
// ============================================================

describe('AddReviewerPRCommand', () => {
  it('should add reviewer to empty list and show success', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
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
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added newuser as reviewer to pull request #42')
      )
    ).toBe(true);
  });

  it('should add reviewer to existing list', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{existing-uuid}', display_name: 'Existing' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
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
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added newuser as reviewer to pull request #42')
      )
    ).toBe(true);
  });

  it('should not duplicate when adding existing reviewer', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{same-uuid}', display_name: 'Same User' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{same-uuid}' });
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
    await command.execute(
      { id: '42', username: 'sameuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Added sameuser as reviewer'))
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
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
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.reviewer.username).toBe('newuser');
    expect(parsed.reviewer.uuid).toBe('{new-uuid}');
    expect(parsed.pullRequest).toBeDefined();
  });

  it('should propagate error when user not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi({ throwOnGetUser: true });
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

    await expect(
      command.execute({ id: '42', username: 'unknown' }, { globalOptions: {} })
    ).rejects.toThrow('User not found');
  });
});

// ============================================================
// RemoveReviewerPRCommand tests
// ============================================================

describe('RemoveReviewerPRCommand', () => {
  it('should remove reviewer from list and show success', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{remove-uuid}', display_name: 'Remove Me' },
        { uuid: '{keep-uuid}', display_name: 'Keep Me' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{remove-uuid}' });
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
    await command.execute(
      { id: '42', username: 'removeuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed removeuser as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should remove last reviewer leaving empty list', async () => {
    const prWithOneReviewer: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{only-uuid}', display_name: 'Only Reviewer' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithOneReviewer],
    });
    const usersApi = createMockUsersApi({ uuid: '{only-uuid}' });
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
    await command.execute(
      { id: '42', username: 'onlyuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed onlyuser as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should succeed silently when removing non-existent reviewer', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{other-uuid}', display_name: 'Other' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{not-in-list}' });
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
    await command.execute(
      { id: '42', username: 'ghost' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed ghost as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{remove-uuid}', display_name: 'Remove Me' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{remove-uuid}' });
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
    await command.execute(
      { id: '42', username: 'removeuser' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.reviewer.username).toBe('removeuser');
    expect(parsed.reviewer.uuid).toBe('{remove-uuid}');
    expect(parsed.pullRequest).toBeDefined();
  });

  it('should propagate error when user not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi({ throwOnGetUser: true });
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

    await expect(
      command.execute({ id: '42', username: 'unknown' }, { globalOptions: {} })
    ).rejects.toThrow('User not found');
  });
});
