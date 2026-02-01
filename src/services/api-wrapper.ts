/**
 * API Client wrapper that provides a cleaner interface over the generated API
 * Handles Set->Array conversion, pagination, and other quirks
 */

import type {
  PullrequestsApi,
  RepositoriesApi,
  UsersApi,
  Pullrequest,
  Repository,
  Account,
  PullrequestComment,
  PullrequestMergeParameters,
} from '../generated/api.js';

/**
 * Convert Set to Array safely
 */
export function toArray<T>(value: Set<T> | T[] | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Array.from(value);
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  values: T[];
  pagelen?: number;
  size?: number;
  page?: number;
  next?: string;
  previous?: string;
}

/**
 * Helper to extract href from links object
 */
export function getHref(
  links: object | undefined,
  key: string
): string | undefined {
  if (!links) return undefined;
  const l = links as Record<string, { href?: string } | undefined>;
  return l[key]?.href;
}

/**
 * Helper to get clone URLs from repository links
 */
export function getCloneUrls(
  links: object | undefined
): Array<{ name: string; href: string }> {
  if (!links) return [];
  const l = links as Record<string, unknown>;
  const clone = l.clone;
  if (!Array.isArray(clone)) return [];
  return clone as Array<{ name: string; href: string }>;
}

/**
 * Helper to get branch name from PR source/destination
 */
export function getBranchName(ref: object | undefined): string | undefined {
  if (!ref) return undefined;
  const r = ref as Record<string, unknown>;
  const branch = r.branch as Record<string, string> | undefined;
  return branch?.name;
}

/**
 * Factory functions for creating API objects with proper type fields
 */
export const factories = {
  pullrequest(data: Omit<Pullrequest, 'type'>): Pullrequest {
    return { ...data, type: 'pullrequest' } as Pullrequest;
  },

  repository(data: Omit<Repository, 'type'>): Repository {
    return { ...data, type: 'repository' } as Repository;
  },

  account(data: Omit<Account, 'type'>): Account {
    return { ...data, type: 'user' } as Account;
  },

  pullrequestComment(
    data: Omit<PullrequestComment, 'type'>
  ): PullrequestComment {
    return { ...data, type: 'pullrequest_comment' } as PullrequestComment;
  },

  pullrequestMergeParameters(
    data: Omit<PullrequestMergeParameters, 'type'>
  ): PullrequestMergeParameters {
    return {
      ...data,
      type: 'pullrequest_merge_parameters',
    } as PullrequestMergeParameters;
  },
};

/**
 * Wrapped PullrequestsApi with convenience methods
 */
export class PullrequestsApiWrapper {
  constructor(private readonly api: PullrequestsApi) {}

  /**
   * List pull requests with array return type
   */
  async list(
    workspace: string,
    repoSlug: string,
    state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED',
    query?: string
  ): Promise<PaginatedResponse<Pullrequest>> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsGet(
        {
          workspace,
          repoSlug,
          state,
        },
        query ? { params: { q: query } } : undefined
      );
    const data = response.data;
    return {
      values: toArray(
        data.values as Set<Pullrequest> | Pullrequest[] | undefined
      ),
      pagelen: data.pagelen,
      size: data.size,
      page: data.page,
      next: data.next,
      previous: data.previous,
    };
  }

  /**
   * Get a single pull request
   */
  async get(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<Pullrequest> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet({
        workspace,
        repoSlug,
        pullRequestId,
      });
    return response.data;
  }

  /**
   * Create a pull request
   */
  async create(
    workspace: string,
    repoSlug: string,
    data: Omit<Pullrequest, 'type'>
  ): Promise<Pullrequest> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPost({
        workspace,
        repoSlug,
        body: factories.pullrequest(data),
      });
    return response.data;
  }

  /**
   * Update a pull request
   */
  async update(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    data: Omit<Pullrequest, 'type'>
  ): Promise<Pullrequest> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut({
        workspace,
        repoSlug,
        pullRequestId,
        body: factories.pullrequest(data),
      });
    return response.data;
  }

  /**
   * Merge a pull request
   */
  async merge(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    data?: Omit<PullrequestMergeParameters, 'type'>
  ): Promise<Pullrequest> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost(
        {
          workspace,
          repoSlug,
          pullRequestId,
          body: data ? factories.pullrequestMergeParameters(data) : undefined,
        }
      );
    return response.data;
  }

  /**
   * Approve a pull request
   */
  async approve(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<void> {
    await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost(
      {
        workspace,
        repoSlug,
        pullRequestId,
      }
    );
  }

  /**
   * Decline a pull request
   */
  async decline(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<Pullrequest> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost(
        {
          workspace,
          repoSlug,
          pullRequestId,
        }
      );
    return response.data;
  }

  /**
   * List comments on a pull request
   */
  async listComments(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PaginatedResponse<PullrequestComment>> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet(
        {
          workspace,
          repoSlug,
          pullRequestId,
        }
      );
    const data = response.data;
    return {
      values: toArray(
        data.values as
          | Set<PullrequestComment>
          | PullrequestComment[]
          | undefined
      ),
      pagelen: data.pagelen,
      size: data.size,
      page: data.page,
      next: data.next,
      previous: data.previous,
    };
  }

  /**
   * Add a comment to a pull request
   */
  async addComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    content: string
  ): Promise<PullrequestComment> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(
        {
          workspace,
          repoSlug,
          pullRequestId,
          body: factories.pullrequestComment({
            content: { raw: content },
          }),
        }
      );
    return response.data;
  }

  /**
   * Update a comment on a pull request
   */
  async updateComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number,
    content: string
  ): Promise<PullrequestComment> {
    const response =
      await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(
        {
          workspace,
          repoSlug,
          pullRequestId,
          commentId,
          body: factories.pullrequestComment({
            content: { raw: content },
          }),
        }
      );
    return response.data;
  }

  /**
   * Delete a comment on a pull request
   */
  async deleteComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<void> {
    await this.api.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete(
      {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
      }
    );
  }
}

/**
 * Wrapped RepositoriesApi with convenience methods
 */
export class RepositoriesApiWrapper {
  constructor(private readonly api: RepositoriesApi) {}

  /**
   * List repositories with array return type
   */
  async list(workspace: string): Promise<PaginatedResponse<Repository>> {
    const response = await this.api.repositoriesWorkspaceGet({
      workspace,
    });
    const data = response.data;
    return {
      values: toArray(
        data.values as Set<Repository> | Repository[] | undefined
      ),
      pagelen: data.pagelen,
      size: data.size,
      page: data.page,
      next: data.next,
      previous: data.previous,
    };
  }

  /**
   * Get a repository
   */
  async get(workspace: string, repoSlug: string): Promise<Repository> {
    const response = await this.api.repositoriesWorkspaceRepoSlugGet({
      workspace,
      repoSlug,
    });
    return response.data;
  }

  /**
   * Create a repository
   */
  async create(
    workspace: string,
    data: Omit<Repository, 'type' | 'links'>
  ): Promise<Repository> {
    const response = await this.api.repositoriesWorkspaceRepoSlugPost({
      workspace,
      repoSlug: (data as { name?: string }).name || '',
      body: factories.repository(data),
    });
    return response.data;
  }

  /**
   * Delete a repository
   */
  async delete(workspace: string, repoSlug: string): Promise<void> {
    await this.api.repositoriesWorkspaceRepoSlugDelete({
      workspace,
      repoSlug,
    });
  }
}

/**
 * Wrapped UsersApi with convenience methods
 */
export class UsersApiWrapper {
  constructor(private readonly api: UsersApi) {}

  /**
   * Get the current user
   */
  async getCurrent(): Promise<Account> {
    const response = await this.api.userGet();
    return response.data;
  }

  /**
   * Get a user by username
   */
  async getByUsername(username: string): Promise<Account> {
    const response = await this.api.usersSelectedUserGet({
      selectedUser: username,
    });
    return response.data;
  }
}
