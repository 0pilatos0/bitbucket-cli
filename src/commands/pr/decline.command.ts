/**
 * Decline PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface DeclinePROptions extends GlobalOptions {}

export class DeclinePRCommand extends BaseCommand<
  { id: string } & DeclinePROptions,
  void
> {
  public readonly name = 'decline';
  public readonly description = 'Decline a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & DeclinePROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const pr = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        pullRequest: pr,
      });
      return;
    }

    this.output.success(`Declined pull request #${prId}: ${pr.title}`);
  }
}
