/**
 * Remove reviewer from PR command implementation
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
    private readonly userResolver: UserResolverService,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RemoveReviewerPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    const user = await this.userResolver.resolve(
      repoContext.workspace,
      options.username
    );

    const updatedPr = await updatePullRequestReviewers(
      this.pullrequestsApi,
      repoContext,
      prId,
      (uuids) => uuids.filter((uuid) => uuid !== user.uuid)
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
      `Removed ${user.displayName ?? options.username} as reviewer from pull request #${prId}`
    );
  }
}
