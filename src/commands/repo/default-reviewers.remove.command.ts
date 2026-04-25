/**
 * Remove a default reviewer from a repository.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { UsersApi } from '../../generated/api.js';
import type { DefaultReviewerService } from '../../services/default-reviewer.service.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface RemoveDefaultReviewerOptions extends GlobalOptions {
  username: string;
  yes?: boolean;
}

export class RemoveDefaultReviewerCommand extends BaseCommand<
  RemoveDefaultReviewerOptions,
  void
> {
  public readonly name = 'default-reviewers.remove';
  public readonly description = 'Remove a default reviewer from a repository';

  constructor(
    private readonly defaultReviewerService: DefaultReviewerService,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RemoveDefaultReviewerOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    if (!options.yes) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          `This will remove ${options.username} from the default reviewers of ` +
          `${repoContext.workspace}/${repoContext.repoSlug}.\n` +
          'Use --yes to confirm.',
      });
    }

    // Same as add: resolve via the users API so nicknames work.
    const userResponse = await this.usersApi.usersSelectedUserGet({
      selectedUser: options.username,
    });
    const identifier = userResponse.data.uuid ?? options.username;

    await this.defaultReviewerService.remove(repoContext, identifier);

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        username: options.username,
      });
      return;
    }

    this.output.success(
      `Removed ${options.username} from default reviewers of ${repoContext.workspace}/${repoContext.repoSlug}`
    );
  }
}
