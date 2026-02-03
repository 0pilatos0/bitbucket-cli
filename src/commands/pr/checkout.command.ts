/**
 * Checkout PR command implementation
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
import { getBranchName } from '../../types/api-helpers.js';

export interface CheckoutPROptions extends GlobalOptions {}

export class CheckoutPRCommand extends BaseCommand<
  { id: string } & CheckoutPROptions,
  void
> {
  public readonly name = 'checkout';
  public readonly description = 'Checkout a pull request locally';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & CheckoutPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    const prResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const pr = prResponse.data;
    const branchName = getBranchName(pr.source);
    const localBranchName = `pr-${prId}`;

    if (!branchName) {
      throw new Error('Pull request source branch not found');
    }

    await this.gitService.fetch();

    try {
      await this.gitService.checkout(branchName);
      this.output.success(`Checked out PR #${prId} as '${branchName}'`);
    } catch {
      await this.gitService.checkoutNewBranch(
        localBranchName,
        `origin/${branchName}`
      );
      this.output.success(`Checked out PR #${prId} as '${localBranchName}'`);
    }

    this.output.text(`  Title: ${pr.title}`);
  }
}
