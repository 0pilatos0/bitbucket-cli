/**
 * Remove reviewer from PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, UsersApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { toArray } from '../../types/api-helpers.js';

export interface RemoveReviewerPROptions extends GlobalOptions {
  id: string;
  username: string;
}

export class RemoveReviewerPRCommand extends BaseCommand<
  RemoveReviewerPROptions,
  void
> {
  public readonly name = 'reviewers.remove';
  public readonly description = 'Remove a reviewer from a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RemoveReviewerPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    // First look up the user to get their UUID
    const userResponse = await this.usersApi.usersSelectedUserGet({
      selectedUser: options.username,
    });
    const user = userResponse.data;

    // Get current PR to see existing reviewers
    const prResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );
    const pr = prResponse.data;

    // Build list of reviewers (excluding the one to remove)
    const existingReviewers = toArray(pr.reviewers);
    const reviewerUuids = existingReviewers
      .map((r) => (r as { uuid?: string }).uuid)
      .filter((uuid) => uuid && uuid !== user.uuid);

    // Update PR with new reviewers list
    await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        body: {
          type: 'pullrequest',
          reviewers: reviewerUuids.map((uuid) => ({ uuid })),
        } as unknown as import('../../generated/api.js').Pullrequest,
      }
    );

    this.output.success(
      `Removed ${options.username} as reviewer from pull request #${prId}`
    );
  }
}
