/**
 * Merge PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  PullrequestMergeParametersMergeStrategyEnum,
  type PullrequestsApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { findPullRequestIdForCurrentBranch } from './shared.js';

const VALID_STRATEGIES = Object.values(
  PullrequestMergeParametersMergeStrategyEnum
) as readonly PullrequestMergeParametersMergeStrategyEnum[];

export interface MergePROptions extends GlobalOptions {
  message?: string;
  closeSourceBranch?: boolean;
  strategy?: string;
}

export class MergePRCommand extends BaseCommand<
  { id?: string } & MergePROptions,
  void
> {
  public readonly name = 'merge';
  public readonly description = 'Merge a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id?: string } & MergePROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId =
      options.id !== undefined
        ? this.parsePositiveInt(options.id, 'id')
        : await findPullRequestIdForCurrentBranch(
            this.pullrequestsApi,
            this.gitService,
            this.contextService,
            repoContext
          );

    const request: {
      type: 'pullrequest_merge_parameters';
      message?: string;
      close_source_branch?: boolean;
      merge_strategy?: PullrequestMergeParametersMergeStrategyEnum;
    } = {
      type: 'pullrequest_merge_parameters',
    };

    if (options.message) {
      request.message = options.message;
    }

    if (options.closeSourceBranch) {
      request.close_source_branch = true;
    }

    if (options.strategy) {
      request.merge_strategy = this.parseEnumOption(
        options.strategy,
        'strategy',
        VALID_STRATEGIES
      );
    }

    const spinner = this.output
      .spinner(`Merging pull request #${prId}...`)
      .start();
    let pr;
    try {
      const response =
        await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost(
          {
            workspace: repoContext.workspace,
            repoSlug: repoContext.repoSlug,
            pullRequestId: prId,
            body: request,
          }
        );
      pr = response.data;
    } finally {
      spinner.stop();
    }

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        pullRequest: pr,
      });
      return;
    }

    this.output.success(`Merged pull request #${prId}: ${pr.title}`);
  }
}
