/**
 * Checkout PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  GitRemote,
  IConfigService,
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import {
  buildCloneUrl,
  getConfiguredProtocol,
  getUrlProtocol,
} from '../../services/clone-url.js';
import { getBranchName } from '../../services/response-parsers.js';
import type { GitProtocol, GlobalOptions } from '../../types/config.js';
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
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & CheckoutPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveIntArg(options.id, 'id');

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

    if (!branchName) {
      throw new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: 'Pull request source branch not found',
        context: { pullRequestId: prId },
      });
    }

    const sourceRepo = pr.source?.repository?.full_name;
    if (!sourceRepo) {
      throw new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: `The source repository of PR #${prId} no longer exists`,
        context: { pullRequestId: prId },
      });
    }

    const targetRepo = `${repoContext.workspace}/${repoContext.repoSlug}`;
    const remotes = await this.gitService.getRemotes();
    const isFork = sourceRepo.toLowerCase() !== targetRepo.toLowerCase();
    // A remote URL we can't parse (e.g. an SSH host alias) still works for a
    // same-repository PR through `origin`, as it always has.
    const sourceRemote =
      this.findRemote(remotes, sourceRepo) ??
      (isFork ? undefined : remotes.find((remote) => remote.name === 'origin'));

    let localBranch: string;
    let startPoint: string;

    if (sourceRemote && !isFork) {
      localBranch = branchName;
      startPoint = `${sourceRemote.name}/${branchName}`;
      await this.gitService.fetch(sourceRemote.name, [
        `+refs/heads/${branchName}:refs/remotes/${startPoint}`,
      ]);
    } else {
      // A fork's branch can share a name with one of ours (`main`), so it
      // gets its own local branch instead of touching ours.
      localBranch = `pr-${prId}`;
      startPoint = 'FETCH_HEAD';
      const source =
        sourceRemote?.name ??
        buildCloneUrl(
          sourceRepo,
          await this.resolveProtocol(this.findRemote(remotes, targetRepo))
        );
      await this.gitService.fetch(source, [`refs/heads/${branchName}`]);
    }

    if (await this.gitService.branchExists(localBranch)) {
      await this.assertCanFastForward(localBranch, startPoint);
      await this.gitService.checkout(localBranch);
      await this.gitService.fastForward(startPoint);
    } else {
      await this.gitService.checkoutNewBranch(localBranch, startPoint);
    }

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        branch: localBranch,
        pullRequest: pr,
      });
      return;
    }

    this.output.success(`Checked out PR #${prId} as '${localBranch}'`);
    this.output.text(`  Title: ${pr.title}`);
  }

  private async assertCanFastForward(
    localBranch: string,
    startPoint: string
  ): Promise<void> {
    const canFastForward =
      (await this.gitService.isAncestor(localBranch, startPoint)) ||
      (await this.gitService.isAncestor(startPoint, localBranch));
    if (!canFastForward) {
      throw new BBError({
        code: ErrorCode.GIT_COMMAND_FAILED,
        message: `Local branch '${localBranch}' has diverged from the pull request; rebase or rename it, then try again`,
        context: { branch: localBranch },
      });
    }
  }

  private findRemote(
    remotes: GitRemote[],
    fullName: string
  ): GitRemote | undefined {
    const matches = remotes.filter((remote) => {
      const repo = this.contextService.parseRemoteUrl(remote.url);
      return (
        repo !== null &&
        `${repo.workspace}/${repo.repoSlug}`.toLowerCase() ===
          fullName.toLowerCase()
      );
    });
    return matches.find((remote) => remote.name === 'origin') ?? matches[0];
  }

  private async resolveProtocol(
    targetRemote: GitRemote | undefined
  ): Promise<GitProtocol> {
    if (targetRemote) {
      return getUrlProtocol(targetRemote.url);
    }
    return getConfiguredProtocol(await this.configService.getConfig());
  }
}
