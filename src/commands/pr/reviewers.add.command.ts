/**
 * Add reviewer to PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, UsersApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface AddReviewerPROptions extends GlobalOptions {
  id: string;
  username: string;
}

export class AddReviewerPRCommand extends BaseCommand<
  AddReviewerPROptions,
  void
> {
  public readonly name = 'reviewers.add';
  public readonly description = 'Add a reviewer to a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddReviewerPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = this.parseIntOption(options.id, 'id');

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

    // Build list of reviewers (existing + new)
    const existingReviewers = pr.reviewers ? Array.from(pr.reviewers) : [];
    const reviewerUuids = existingReviewers
      .map((r) => (r as { uuid?: string }).uuid)
      .filter(Boolean);

    if (!reviewerUuids.includes(user.uuid)) {
      reviewerUuids.push(user.uuid);
    }

    // Update PR with new reviewers list
    const response =
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

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        pullRequestId: prId,
        reviewer: {
          username: options.username,
          uuid: user.uuid,
        },
        pullRequest: response.data,
      });
      return;
    }

    this.output.success(
      `Added ${options.username} as reviewer to pull request #${prId}`
    );
  }
}
