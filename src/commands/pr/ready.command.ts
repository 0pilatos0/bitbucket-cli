/**
 * Ready PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ReadyPROptions extends GlobalOptions {}

export class ReadyPRCommand extends BaseCommand<
  { id: string } & ReadyPROptions,
  void
> {
  public readonly name = 'ready';
  public readonly description = 'Mark a draft pull request as ready for review';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ReadyPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          pullrequest: {
            type: 'pullrequest',
            draft: false,
          },
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

    this.output.success(`Marked pull request #${prId} as ready for review`);
    this.output.text(`  ${pr.title}`);
  }
}
