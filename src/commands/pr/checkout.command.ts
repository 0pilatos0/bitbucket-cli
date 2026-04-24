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
import { getBranchName } from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

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
      throw new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: 'Pull request source branch not found',
        context: { pullRequestId: prId },
      });
    }

    await this.gitService.fetch();

    let checkedOutBranch: string;

    try {
      await this.gitService.checkout(branchName);
      checkedOutBranch = branchName;
      if (context.globalOptions.json) {
        await this.output.json({
          success: true,
          pullRequestId: prId,
          branch: checkedOutBranch,
          pullRequest: pr,
        });
        return;
      }
      this.output.success(`Checked out PR #${prId} as '${branchName}'`);
    } catch {
      await this.gitService.checkoutNewBranch(
        localBranchName,
        `origin/${branchName}`
      );
      checkedOutBranch = localBranchName;
      if (context.globalOptions.json) {
        await this.output.json({
          success: true,
          pullRequestId: prId,
          branch: checkedOutBranch,
          pullRequest: pr,
        });
        return;
      }
      this.output.success(`Checked out PR #${prId} as '${localBranchName}'`);
    }

    this.output.text(`  Title: ${pr.title}`);
  }
}
