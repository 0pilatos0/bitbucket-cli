import type { RawAxiosRequestConfig } from 'axios';
import type {
  Account,
  CommitStatusesApi,
  Commitstatus,
  PaginatedCommitstatuses,
  PaginatedPullrequests,
  Participant,
  Pullrequest,
  PullrequestComment,
  PullrequestsApi,
  UsersApi,
  WorkspacesApi,
} from '../../../src/generated/api.js';
import { UserResolverService } from '../../../src/services/user-resolver.service.js';
import {
  axiosResponse,
  extractPaginationParams,
  fakeApi,
  fakeUsersApi,
  type FakeApi,
} from '../../helpers/fake-api.js';
import {
  mockDiff,
  mockDiffStat,
  mockPullRequest,
  mockUser,
} from '../../setup.js';

/** Last request each mutating endpoint received, for assertions. */
export interface PullrequestsApiRecorder {
  lastCommentBody?: Record<string, unknown>;
  lastCommentRequest?: Record<string, unknown>;
  lastCommentEditBody?: Record<string, unknown>;
  lastResolveRequest?: Record<string, unknown>;
  lastResolveOptions?: RawAxiosRequestConfig;
  lastUnresolveRequest?: Record<string, unknown>;
  lastCommentGetRequest?: Record<string, unknown>;
  lastMergeBody?: Record<string, unknown>;
  lastPutBody?: Record<string, unknown>;
}

export function createMockPullrequestsApi(
  options: {
    pullRequests?: Pullrequest[];
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
): PullrequestsApi & PullrequestsApiRecorder {
  const prs = options.pullRequests ?? [mockPullRequest];
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

  const mockApi: FakeApi<PullrequestsApi> & PullrequestsApiRecorder = {
    async repositoriesWorkspaceRepoSlugPullrequestsGet(
      request: unknown,
      axiosOptions?: unknown
    ) {
      if (options.throwOnList) {
        throw new Error('API Error');
      }

      options.onListCall?.(request, axiosOptions);

      const { page, pagelen } = extractPaginationParams(axiosOptions);

      const query = (axiosOptions as RawAxiosRequestConfig | undefined)?.params
        ?.q as string | undefined;
      const branchLiteral = query?.match(
        /^source\.branch\.name = (".*")$/
      )?.[1];
      if (branchLiteral !== undefined) {
        const branch = JSON.parse(branchLiteral) as string;
        const matches = prs.filter(
          (pr) =>
            (pr.source as { branch?: { name?: string } } | undefined)?.branch
              ?.name === branch
        );
        return axiosResponse<PaginatedPullrequests>({
          values: new Set(matches),
          page: 1,
          pagelen,
          size: matches.length,
        });
      }

      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      const pageValues = prs.slice(start, end);
      const totalSize = prs.length;
      const hasNext = end < prs.length;

      const paginated: PaginatedPullrequests = {
        values: new Set(pageValues),
        page,
        pagelen,
        size: totalSize,
        next: hasNext
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?page=${page + 1}`
          : undefined,
      };

      return axiosResponse(paginated);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnGet) {
        throw new Error('API Error');
      }
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return axiosResponse(pr);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPost(params: {
      body?: Pullrequest;
    }) {
      if (options.throwOnCreate) {
        throw new Error('API Error');
      }
      const body: Partial<Pullrequest> = params.body ?? {};
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
      return axiosResponse(newPr);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost(params: {
      pullRequestId: number;
      body?: Record<string, unknown>;
    }) {
      if (options.throwOnMerge) {
        throw new Error('API Error');
      }
      mockApi.lastMergeBody = params.body;
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return axiosResponse({
        ...pr,
        state: 'MERGED' as const,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost(_params: {
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
      return axiosResponse(participant);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnDecline) {
        throw new Error('API Error');
      }
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return axiosResponse({
        ...pr,
        state: 'DECLINED' as const,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(params: {
      pullRequestId: number;
      body?: Pullrequest;
    }) {
      if (options.throwOnUpdate) {
        throw new Error('API Error');
      }
      mockApi.lastPutBody = params.body;
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      const body: Partial<Pullrequest> = params.body ?? {};
      return axiosResponse({
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
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return axiosResponse(mockDiff);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(params: {
      pullRequestId: number;
    }) {
      if (options.throwOnDiffstat) {
        throw new Error('API Error');
      }
      const pr = prs.find((p) => p.id === params.pullRequestId);
      if (!pr) {
        throw new Error('Not found');
      }
      return axiosResponse({
        values: new Set([
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
      });
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

      return axiosResponse({
        values: new Set(pageValues),
        page,
        pagelen,
        size: totalSize,
        next: hasNext
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/${params.pullRequestId}/activity?page=${page + 1}`
          : undefined,
      });
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

      return axiosResponse({
        values: new Set(pageValues),
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
      if (options.commentPostError !== undefined) {
        throw options.commentPostError;
      }
      if (options.throwOnComment) {
        throw new Error('API Error');
      }
      const body = params.body;
      mockApi.lastCommentBody = body;
      mockApi.lastCommentRequest = params;
      return axiosResponse({
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
      return axiosResponse(undefined);
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(params: {
      workspace: string;
      repoSlug: string;
      pullRequestId: number;
      commentId: number;
      body: Record<string, unknown>;
    }) {
      mockApi.lastCommentEditBody = params.body;
      if (options.throwOnCommentEdit) {
        throw new Error('API Error');
      }
      return axiosResponse({
        id: params.commentId,
        type: 'pullrequest_comment',
        content: params.body.content,
      });
    },

    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost(
      params: {
        workspace: string;
        repoSlug: string;
        pullRequestId: number;
        commentId: number;
      },
      axiosOptions?: RawAxiosRequestConfig
    ) {
      if (options.commentResolveError !== undefined) {
        throw options.commentResolveError;
      }
      if (options.throwOnCommentResolve) {
        throw new Error('API Error');
      }
      mockApi.lastResolveRequest = params;
      mockApi.lastResolveOptions = axiosOptions;
      return axiosResponse({
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
      return axiosResponse(undefined);
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
      return axiosResponse(
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

  return fakeApi<PullrequestsApi, PullrequestsApiRecorder>(mockApi);
}

export function createMockCommitStatusesApi(
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

  return fakeApi<CommitStatusesApi>({
    async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet() {
      if (options.throwOnGet) {
        throw new Error('API Error');
      }

      const paginated: PaginatedCommitstatuses = {
        values: new Set(statuses),
        pagelen: 25,
        size: statuses.length,
      };

      return axiosResponse(paginated);
    },
  });
}

/**
 * Resolves `@me` through the mocked `GET /user` and everything else through
 * `GET /users/{id}`; the name/email rules are covered in
 * user-resolver.service.test.ts and by createMembersResolver below.
 */
export function createUserResolverStub(
  usersApi: UsersApi
): UserResolverService {
  return fakeApi<UserResolverService>({
    async resolve(_workspace, user) {
      const { data } =
        user === '@me'
          ? await usersApi.userGet()
          : await usersApi.usersSelectedUserGet({ selectedUser: user });
      return { uuid: data.uuid!, displayName: data.display_name };
    },
  });
}

/** A real resolver whose workspace member list is `members`. */
export function createMembersResolver(
  usersApi: UsersApi,
  members: Account[]
): { resolver: UserResolverService; workspaces: string[] } {
  const workspaces: string[] = [];
  const workspacesApi = fakeApi<WorkspacesApi>({
    async workspacesWorkspaceMembersGet(request) {
      workspaces.push(request.workspace);
      return axiosResponse({
        values: members.map((user) => ({ type: 'workspace_membership', user })),
      });
    },
  });
  return {
    resolver: new UserResolverService(usersApi, workspacesApi),
    workspaces,
  };
}

export const JOHN_PARK_A = {
  type: 'user',
  uuid: '{john-a}',
  account_id: '712020:john-a',
  display_name: 'John Park',
  nickname: 'jpark',
} as Account;
export const JOHN_PARK_B = {
  type: 'user',
  uuid: '{john-b}',
  account_id: '712020:john-b',
  display_name: 'John Park',
  nickname: 'johnp',
} as Account;

/** `userGet` and `usersSelectedUserGet` both answer with `uuid`. */
export function createMockUsersApi(
  options: { uuid?: string; throwOnGetUser?: boolean } = {}
): UsersApi {
  return fakeUsersApi({
    currentUser: { ...mockUser, uuid: options.uuid },
    resolveUser: () => {
      if (options.throwOnGetUser) {
        throw new Error('User not found');
      }
      return { ...mockUser, uuid: options.uuid ?? '{user-uuid}' };
    },
  });
}
