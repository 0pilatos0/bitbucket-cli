/**
 * View PR command implementation
 */

import chalk from 'chalk';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, Pullrequest } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { getLinkHref, toArray } from '../../types/api-helpers.js';

export interface ViewPROptions extends GlobalOptions {}

export class ViewPRCommand extends BaseCommand<
  { id: string } & ViewPROptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View pull request details';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ViewPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const pr = response.data;

    this.renderHeader(pr);
    this.renderDescription(pr);
    this.renderBranchInfo(pr);
    this.renderMetadata(pr);
    this.renderReviewers(pr);
    this.renderFooter(pr);
  }

  private renderHeader(pr: Pullrequest): void {
    const stateColor = this.getStateColor(pr.state);
    const draftLabel = pr.draft ? chalk.yellow(' [DRAFT]') : '';

    this.output.text('');
    this.output.text(
      `${chalk.bold(`#${pr.id}`)} ${pr.title}${draftLabel} ${stateColor(`[${pr.state}]`)}`
    );
    this.output.text(chalk.gray('─'.repeat(60)));
  }

  private renderDescription(pr: Pullrequest): void {
    if (pr.description) {
      this.output.text(pr.description);
      this.output.text('');
    }
  }

  private renderBranchInfo(pr: Pullrequest): void {
    const source = pr.source as
      | { branch?: { name?: string }; commit?: { hash?: string } }
      | undefined;
    const destination = pr.destination as
      | { branch?: { name?: string }; commit?: { hash?: string } }
      | undefined;
    const sourceBranch = chalk.cyan(source?.branch?.name ?? 'unknown');
    const destBranch = chalk.cyan(destination?.branch?.name ?? 'unknown');
    const arrow = chalk.gray(' → ');

    this.output.text(
      `${chalk.dim('Branch:')}   ${sourceBranch}${arrow}${destBranch}`
    );

    if (source?.commit?.hash || destination?.commit?.hash) {
      const sourceHash = source?.commit?.hash
        ? chalk.gray(source.commit.hash.slice(0, 7))
        : chalk.gray('unknown');
      const destHash = destination?.commit?.hash
        ? chalk.gray(destination.commit.hash.slice(0, 7))
        : chalk.gray('unknown');
      this.output.text(
        `${chalk.dim('Commits:')}  ${sourceHash}${arrow}${destHash}`
      );
    }
  }

  private renderMetadata(pr: Pullrequest): void {
    this.output.text(
      `${chalk.dim('Author:')}   ${pr.author?.display_name ?? 'Unknown'}`
    );

    if (pr.closed_by) {
      const action = pr.state === 'MERGED' ? 'Merged' : 'Closed';
      this.output.text(
        `${chalk.dim(action + ':')}   ${pr.closed_by.display_name}`
      );
    }

    const createdOn = pr.created_on
      ? this.output.formatDate(pr.created_on)
      : 'Unknown';
    const updatedOn = pr.updated_on
      ? this.output.formatDate(pr.updated_on)
      : 'Unknown';
    this.output.text(`${chalk.dim('Created:')}  ${createdOn}`);
    this.output.text(`${chalk.dim('Updated:')}  ${updatedOn}`);

    const mergeCommit = pr.merge_commit as { hash?: string } | undefined;
    if (mergeCommit?.hash) {
      this.output.text(
        `${chalk.dim('Merge:')}    ${chalk.magenta(mergeCommit.hash.slice(0, 7))}`
      );
    }

    const closeBranchIndicator = pr.close_source_branch
      ? chalk.green('✓')
      : chalk.gray('✗');
    this.output.text(
      `${chalk.dim('Close Src:')} ${closeBranchIndicator} ${chalk.gray('(close source branch on merge)')}`
    );

    this.output.text(
      `${chalk.dim('Activity:')} ${pr.comment_count ?? 0} comments · ${pr.task_count ?? 0} tasks`
    );
  }

  private renderReviewers(pr: Pullrequest): void {
    const participants = toArray(pr.participants);
    const reviewers = participants.filter((p) => p.role === 'REVIEWER');

    if (reviewers.length === 0) {
      this.output.text('');
      this.output.text(chalk.gray('No reviewers assigned'));
      return;
    }

    this.output.text('');
    this.output.text(chalk.dim('Reviewers:'));

    for (const reviewer of reviewers) {
      const status = this.getReviewerStatus(reviewer);
      this.output.text(
        `  ${status.icon} ${reviewer.user?.display_name ?? 'Unknown'} ${chalk.gray(status.label)}`
      );
    }
  }

  private getReviewerStatus(reviewer: { approved?: boolean; state?: string }): {
    icon: string;
    label: string;
  } {
    if (reviewer.approved) {
      return { icon: chalk.green('✓'), label: 'approved' };
    }

    if (reviewer.state === 'changes_requested') {
      return { icon: chalk.red('✗'), label: 'changes requested' };
    }

    return { icon: chalk.yellow('○'), label: 'pending' };
  }

  private renderFooter(pr: Pullrequest): void {
    const url = getLinkHref(pr.links, 'html');
    this.output.text('');
    this.output.text(chalk.gray('─'.repeat(60)));
    this.output.text(`${chalk.dim('URL:')} ${chalk.blue.underline(url ?? '')}`);
    this.output.text('');
  }

  private getStateColor(state?: string): (text: string) => string {
    switch (state) {
      case 'OPEN':
        return chalk.green;
      case 'MERGED':
        return chalk.magenta;
      case 'DECLINED':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }
}
