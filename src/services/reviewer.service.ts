/**
 * Shared logic for updating pull request reviewers.
 */

import type {
  Account,
  Pullrequest,
  PullrequestsApi,
} from '../generated/api.js';

export interface RepoContext {
  workspace: string;
  repoSlug: string;
}

/**
 * Extract UUIDs from a reviewer collection in a type-safe way.
 *
 * The generated `Pullrequest.reviewers` is typed as `Array<Account>`,
 * but the API may return a `Set` or other iterable — `Array.from`
 * normalises this.  Each `Account` has an optional `uuid` field, so
 * we filter out entries without one.
 */
export function extractReviewerUuids(
  reviewers: Pullrequest['reviewers']
): string[] {
  if (!reviewers) {
    return [];
  }

  const list: Account[] = Array.from(reviewers);
  const uuids: string[] = [];

  for (const reviewer of list) {
    if (reviewer.uuid) {
      uuids.push(reviewer.uuid);
    }
  }

  return uuids;
}

/**
 * Build a type-safe `Pullrequest` body containing only the reviewers
 * field, suitable for a PUT update.
 */
export function buildReviewersUpdateBody(uuids: string[]): Pullrequest {
  const body: Pullrequest = {
    type: 'pullrequest',
    reviewers: uuids.map((uuid) => ({ type: 'user', uuid }) as Account),
  };
  return body;
}

/**
 * Fetch a pull request, apply a UUID-level transform to its reviewer
 * list, and PUT the result back.  Returns the API response data.
 */
export async function updatePullRequestReviewers(
  pullrequestsApi: PullrequestsApi,
  repoContext: RepoContext,
  prId: number,
  transformUuids: (uuids: string[]) => string[]
): Promise<Pullrequest> {
  // Get current PR to see existing reviewers
  const prResponse =
    await pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
      }
    );
  const pr = prResponse.data;

  const currentUuids = extractReviewerUuids(pr.reviewers);
  const updatedUuids = transformUuids(currentUuids);
  const body = buildReviewersUpdateBody(updatedUuids);

  const response =
    await pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        pullrequest: body,
      }
    );

  return response.data;
}
