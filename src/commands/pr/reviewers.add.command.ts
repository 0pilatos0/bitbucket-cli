/**
 * Add reviewer to PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import { updatePullRequestReviewers } from '../../services/reviewer.service.js';
import type { UserResolverService } from '../../services/user-resolver.service.js';
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
    private readonly userResolver: UserResolverService,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddReviewerPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveIntArg(options.id, 'id');

    const user = await this.userResolver.resolve(
      repoContext.workspace,
      options.username
    );

    const updatedPr = await updatePullRequestReviewers(
      this.pullrequestsApi,
      repoContext,
      prId,
      (uuids) => {
        if (!uuids.includes(user.uuid)) {
          return [...uuids, user.uuid];
        }
        return uuids;
      }
    );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        reviewer: {
          username: options.username,
          uuid: user.uuid,
        },
        pullRequest: updatedPr,
      });
      return;
    }

    this.output.success(
      `Added ${user.displayName ?? options.username} as reviewer to pull request #${prId}`
    );
  }
}
