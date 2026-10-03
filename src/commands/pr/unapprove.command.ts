/**
 * Unapprove PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface UnapprovePROptions extends GlobalOptions {}

export class UnapprovePRCommand extends BaseCommand<
  { id: string } & UnapprovePROptions,
  void
> {
  public readonly name = 'unapprove';
  public readonly description = 'Withdraw your approval of a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & UnapprovePROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApproveDelete(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
      }
    );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
      });
      return;
    }

    this.output.success(`Withdrew approval of pull request #${prId}`);
  }
}
