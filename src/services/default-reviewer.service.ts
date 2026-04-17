/**
 * Default reviewer service.
 *
 * Wraps the Bitbucket repository default-reviewer endpoints and hides
 * pagination + response-shape differences between the `default-reviewers`
 * (plain) and `effective-default-reviewers` endpoints.
 */

import type {
  Account,
  DefaultReviewerAndType,
  PaginatedAccounts,
  PaginatedDefaultReviewerAndType,
  PullrequestsApi,
  User,
} from '../generated/api.js';
import type { RepoContext } from '../types/config.js';
import { collectPages } from './pagination.js';

export type DefaultReviewerMode = 'direct' | 'effective';

export interface DefaultReviewerEntry {
  uuid: string;
  accountId?: string;
  displayName?: string;
  nickname?: string;
  /** 'repository' | 'project' — only populated in `effective` mode. */
  reviewerType?: string;
}

// Upper bound; the repo/project default reviewer list is small in practice
// but we still want to walk pagination defensively.
const LIST_LIMIT = 500;

export class DefaultReviewerService {
  constructor(private readonly pullrequestsApi: PullrequestsApi) {}

  public async list(
    repo: RepoContext,
    mode: DefaultReviewerMode = 'effective'
  ): Promise<DefaultReviewerEntry[]> {
    if (mode === 'effective') {
      return this.listEffective(repo);
    }

    return this.listDirect(repo);
  }

  public async add(
    repo: RepoContext,
    username: string
  ): Promise<DefaultReviewerEntry> {
    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut(
        {
          workspace: repo.workspace,
          repoSlug: repo.repoSlug,
          targetUsername: username,
        }
      );

    return accountToEntry(response.data);
  }

  public async remove(repo: RepoContext, username: string): Promise<void> {
    await this.pullrequestsApi.repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete(
      {
        workspace: repo.workspace,
        repoSlug: repo.repoSlug,
        targetUsername: username,
      }
    );
  }

  private async listDirect(repo: RepoContext): Promise<DefaultReviewerEntry[]> {
    const accounts = await collectPages<Account>({
      limit: LIST_LIMIT,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.pullrequestsApi.repositoriesWorkspaceRepoSlugDefaultReviewersGet(
            {
              workspace: repo.workspace,
              repoSlug: repo.repoSlug,
            },
            { params: { page, pagelen } }
          );
        return response.data as PaginatedAccounts;
      },
    });

    return accounts.map((account) => accountToEntry(account));
  }

  private async listEffective(
    repo: RepoContext
  ): Promise<DefaultReviewerEntry[]> {
    const entries = await collectPages<DefaultReviewerAndType>({
      limit: LIST_LIMIT,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.pullrequestsApi.repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet(
            {
              workspace: repo.workspace,
              repoSlug: repo.repoSlug,
            },
            { params: { page, pagelen } }
          );
        return response.data as PaginatedDefaultReviewerAndType;
      },
    });

    const mapped: DefaultReviewerEntry[] = [];
    for (const entry of entries) {
      const user = entry.user;
      if (!user?.uuid) {
        continue;
      }
      mapped.push({
        ...accountToEntry(user),
        reviewerType: entry.reviewer_type,
      });
    }
    return mapped;
  }
}

function accountToEntry(account: Account | User): DefaultReviewerEntry {
  const asUser = account as User;
  return {
    uuid: account.uuid ?? '',
    accountId: asUser.account_id,
    displayName: account.display_name,
    nickname: asUser.nickname,
  };
}
