/**
 * List reviewers on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListReviewersPROptions extends GlobalOptions {
  id: string;
}

export class ListReviewersPRCommand extends BaseCommand<
  ListReviewersPROptions,
  void
> {
  public readonly name = 'reviewers.list';
  public readonly description = 'List reviewers on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListReviewersPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = this.parseIntOption(options.id, 'id');

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const pr = response.data;
    const reviewers = Array.from(pr.reviewers ?? []);

    if (context.globalOptions.json) {
      await this.output.json({
        pullRequestId: prId,
        count: reviewers.length,
        reviewers,
      });
      return;
    }

    if (reviewers.length === 0) {
      this.output.info('No reviewers assigned to this pull request');
    } else {
      this.output.table(
        ['Display Name', 'Account ID'],
        reviewers.map((r) => [r.display_name ?? 'Unknown', r.account_id ?? ''])
      );
    }
  }
}
