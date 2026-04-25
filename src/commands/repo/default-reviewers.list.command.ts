/**
 * List repository default reviewers command.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { DefaultReviewerService } from '../../services/default-reviewer.service.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListDefaultReviewersOptions extends GlobalOptions {
  repoOnly?: boolean;
}

export class ListDefaultReviewersCommand extends BaseCommand<
  ListDefaultReviewersOptions,
  void
> {
  public readonly name = 'default-reviewers.list';
  public readonly description = 'List default reviewers for a repository';

  constructor(
    private readonly defaultReviewerService: DefaultReviewerService,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListDefaultReviewersOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const mode = options.repoOnly ? 'direct' : 'effective';
    const reviewers = await this.defaultReviewerService.list(repoContext, mode);

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        mode,
        count: reviewers.length,
        reviewers,
      });
      return;
    }

    if (reviewers.length === 0) {
      this.output.info('No default reviewers configured for this repository');
      return;
    }

    if (mode === 'effective') {
      this.output.table(
        ['Display Name', 'Nickname', 'Source'],
        reviewers.map((r) => [
          r.displayName ?? 'Unknown',
          r.nickname ?? '',
          r.reviewerType ?? '',
        ])
      );
    } else {
      this.output.table(
        ['Display Name', 'Nickname'],
        reviewers.map((r) => [r.displayName ?? 'Unknown', r.nickname ?? ''])
      );
    }
  }
}
