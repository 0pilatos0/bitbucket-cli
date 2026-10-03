/**
 * Request changes on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { findPullRequestIdForCurrentBranch } from './shared.js';

export interface RequestChangesPROptions extends GlobalOptions {
  undo?: boolean;
}

export class RequestChangesPRCommand extends BaseCommand<
  { id?: string } & RequestChangesPROptions,
  void
> {
  public readonly name = 'request-changes';
  public readonly description = 'Request changes on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id?: string } & RequestChangesPROptions,
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
    const request = {
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      pullRequestId: prId,
    };

    if (options.undo) {
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesDelete(
        request
      );
    } else {
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesPost(
        request
      );
    }

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        changesRequested: !options.undo,
      });
      return;
    }

    this.output.success(
      options.undo
        ? `Removed your change request from pull request #${prId}`
        : `Requested changes on pull request #${prId}`
    );
  }
}
