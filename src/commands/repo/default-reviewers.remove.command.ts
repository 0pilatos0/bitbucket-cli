/**
 * Remove a default reviewer from a repository.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
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
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RemoveDefaultReviewerOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    if (!options.yes) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          `This will remove ${options.username} from the default reviewers of ` +
          `${repoContext.workspace}/${repoContext.repoSlug}.\n` +
          'Use --yes to confirm.',
      });
    }

    await this.defaultReviewerService.remove(repoContext, options.username);

    if (context.globalOptions.json) {
      this.output.json({
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
