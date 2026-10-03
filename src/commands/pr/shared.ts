/**
 * Shared helpers for the `bb pr` command group.
 */

import type {
  IContextService,
  IGitService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import { MAX_PAGE_LENGTH } from '../../services/pagination.js';
import type { RepoContext } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export const PR_ID_ARGUMENT_DESCRIPTION =
  'Pull request ID (default: the open PR for the current branch)';

/** BBQL string literal: double-quoted, with `\` and `"` backslash-escaped. */
function bbqlString(value: string): string {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`;
}

/**
 * Find the single open pull request whose source is the current git branch of
 * this checkout. Filters on the branch server-side so a busy repo costs one
 * request, drops pull requests from other repositories (a fork's `main` is not
 * yours), and refuses to guess when several match.
 */
export async function findPullRequestIdForCurrentBranch(
  pullrequestsApi: PullrequestsApi,
  gitService: IGitService,
  contextService: IContextService,
  repoContext: RepoContext
): Promise<number> {
  let branch: string;
  try {
    branch = await gitService.getCurrentBranch();
  } catch (error) {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message:
        'No pull request ID given and the current git branch could not be determined. Pass a pull request ID.',
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (branch === 'HEAD') {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message:
        'No pull request ID given and HEAD is detached. Pass a pull request ID.',
    });
  }

  // The branch lives in the checkout's own repository, which differs from
  // the target when working from a fork with `--repo upstream`.
  const sourceRepo =
    (await contextService.getRepoContextFromGit()) ?? repoContext;
  const sourceFullName =
    `${sourceRepo.workspace}/${sourceRepo.repoSlug}`.toLowerCase();

  const response =
    await pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        state: 'OPEN',
      },
      {
        params: {
          q: `source.branch.name = ${bbqlString(branch)}`,
          pagelen: MAX_PAGE_LENGTH,
        },
      }
    );
  const matches = Array.from(response.data.values ?? []).filter(
    (pullRequest) => {
      const fullName = (
        pullRequest.source as
          { repository?: { full_name?: string } } | undefined
      )?.repository?.full_name;
      return !fullName || fullName.toLowerCase() === sourceFullName;
    }
  );

  if (matches.length === 0) {
    throw new BBError({
      code: ErrorCode.API_NOT_FOUND,
      message: `No open pull request found for branch "${branch}". Pass a pull request ID.`,
      context: { branch },
    });
  }

  if (matches.length > 1) {
    const ids = matches.map((pullRequest) => pullRequest.id);
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message: `Branch "${branch}" has ${matches.length} open pull requests (${ids.map((id) => `#${id}`).join(', ')}). Pass a pull request ID.`,
      context: { branch, pullRequestIds: ids },
    });
  }

  return matches[0]!.id!;
}
