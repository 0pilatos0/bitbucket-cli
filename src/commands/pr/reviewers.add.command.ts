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
import { updatePullRequestReviewers } from '../../services/reviewer.service.js';
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

    // Look up the user to get their UUID
    const userResponse = await this.usersApi.usersSelectedUserGet({
      selectedUser: options.username,
    });
    const user = userResponse.data;

    const updatedPr = await updatePullRequestReviewers(
      this.pullrequestsApi,
      repoContext,
      prId,
      (uuids) => {
        if (!uuids.includes(user.uuid!)) {
          return [...uuids, user.uuid!];
        }
        return uuids;
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
        pullRequest: updatedPr,
      });
      return;
    }

    this.output.success(
      `Added ${options.username} as reviewer to pull request #${prId}`
    );
  }
}
