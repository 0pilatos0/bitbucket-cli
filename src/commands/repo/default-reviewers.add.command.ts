/**
 * Add a default reviewer to a repository.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { DefaultReviewerService } from '../../services/default-reviewer.service.js';
import type { GlobalOptions } from '../../types/config.js';

export interface AddDefaultReviewerOptions extends GlobalOptions {
  username: string;
}

export class AddDefaultReviewerCommand extends BaseCommand<
  AddDefaultReviewerOptions,
  void
> {
  public readonly name = 'default-reviewers.add';
  public readonly description = 'Add a default reviewer to a repository';

  constructor(
    private readonly defaultReviewerService: DefaultReviewerService,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddDefaultReviewerOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const entry = await this.defaultReviewerService.add(
      repoContext,
      options.username
    );

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        reviewer: entry,
      });
      return;
    }

    this.output.success(
      `Added ${entry.displayName ?? options.username} as a default reviewer for ${repoContext.workspace}/${repoContext.repoSlug}`
    );
  }
}
