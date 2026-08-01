/**
 * View PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, Pullrequest } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

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
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    const response = await this.pullrequestsApi
      .repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Pull request #${prId} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    const pr = response.data;

    if (context.globalOptions.json) {
      await this.output.json(pr);
      return;
    }

    this.renderHeader(pr);
    this.renderDescription(pr);
    this.renderBranchInfo(pr);
    this.renderMetadata(pr);
    this.renderReviewers(pr);
    this.renderFooter(pr);
  }

  private renderHeader(pr: Pullrequest): void {
    const stateColor = this.getStateColor(pr.state);
    const draftLabel = pr.draft ? this.output.yellow(' [DRAFT]') : '';

    this.output.text('');
    this.output.text(
      `${this.output.bold(`#${pr.id}`)} ${pr.title}${draftLabel} ${stateColor(`[${pr.state}]`)}`
    );
    this.output.separator();
  }

  private renderDescription(pr: Pullrequest): void {
    if (pr.description) {
      this.output.text(pr.description);
      this.output.text('');
    }
  }

  private renderBranchInfo(pr: Pullrequest): void {
    const source = pr.source as
      { branch?: { name?: string }; commit?: { hash?: string } } | undefined;
    const destination = pr.destination as
      { branch?: { name?: string }; commit?: { hash?: string } } | undefined;
    const sourceBranch = this.output.cyan(source?.branch?.name ?? 'unknown');
    const destBranch = this.output.cyan(destination?.branch?.name ?? 'unknown');
    const arrow = this.output.gray(this.output.symbol(' → ', ' -> '));

    this.output.text(
      `${this.output.dim('Branch:')}   ${sourceBranch}${arrow}${destBranch}`
    );

    if (source?.commit?.hash || destination?.commit?.hash) {
      const sourceHash = source?.commit?.hash
        ? this.output.gray(source.commit.hash.slice(0, 7))
        : this.output.gray('unknown');
      const destHash = destination?.commit?.hash
        ? this.output.gray(destination.commit.hash.slice(0, 7))
        : this.output.gray('unknown');
      this.output.text(
        `${this.output.dim('Commits:')}  ${sourceHash}${arrow}${destHash}`
      );
    }
  }

  private renderMetadata(pr: Pullrequest): void {
    this.output.text(
      `${this.output.dim('Author:')}   ${pr.author?.display_name ?? 'Unknown'}`
    );

    if (pr.closed_by) {
      const action = pr.state === 'MERGED' ? 'Merged' : 'Closed';
      this.output.text(
        `${this.output.dim(action + ':')}   ${pr.closed_by.display_name}`
      );
    }

    const createdOn = pr.created_on
      ? this.output.formatDate(pr.created_on)
      : 'Unknown';
    const updatedOn = pr.updated_on
      ? this.output.formatDate(pr.updated_on)
      : 'Unknown';
    this.output.text(`${this.output.dim('Created:')}  ${createdOn}`);
    this.output.text(`${this.output.dim('Updated:')}  ${updatedOn}`);

    const mergeCommit = pr.merge_commit as { hash?: string } | undefined;
    if (mergeCommit?.hash) {
      this.output.text(
        `${this.output.dim('Merge:')}    ${this.output.magenta(mergeCommit.hash.slice(0, 7))}`
      );
    }

    const closeBranchIndicator = pr.close_source_branch
      ? this.output.green(this.output.symbol('✓', 'yes'))
      : this.output.gray(this.output.symbol('✗', 'no'));
    this.output.text(
      `${this.output.dim('Close Src:')} ${closeBranchIndicator} ${this.output.gray('(close source branch on merge)')}`
    );

    this.output.text(
      `${this.output.dim('Activity:')} ${pr.comment_count ?? 0} comments · ${pr.task_count ?? 0} tasks`
    );
  }

  private renderReviewers(pr: Pullrequest): void {
    const participants = pr.participants ? Array.from(pr.participants) : [];
    const reviewers = participants.filter((p) => p.role === 'REVIEWER');

    if (reviewers.length === 0) {
      this.output.text('');
      this.output.info('No reviewers assigned');
      return;
    }

    this.output.text('');
    this.output.text(this.output.dim('Reviewers:'));

    for (const reviewer of reviewers) {
      const status = this.getReviewerStatus({
        approved: reviewer.approved,
        state: reviewer.state ?? undefined,
      });
      this.output.text(
        `  ${status.icon} ${reviewer.user?.display_name ?? 'Unknown'} ${this.output.gray(status.label)}`
      );
    }
  }

  private getReviewerStatus(reviewer: { approved?: boolean; state?: string }): {
    icon: string;
    label: string;
  } {
    if (reviewer.approved) {
      return {
        icon: this.output.green(this.output.symbol('✓', '[OK]')),
        label: 'approved',
      };
    }

    if (reviewer.state === 'changes_requested') {
      return {
        icon: this.output.red(this.output.symbol('✗', '[X]')),
        label: 'changes requested',
      };
    }

    return {
      icon: this.output.yellow(this.output.symbol('○', '[ ]')),
      label: 'pending',
    };
  }

  private renderFooter(pr: Pullrequest): void {
    const links = pr.links as { html?: { href?: string } } | undefined;
    this.output.text('');
    this.output.separator();
    this.output.text(
      `${this.output.dim('URL:')} ${this.output.underline(this.output.blue(links?.html?.href ?? ''))}`
    );
    this.output.text('');
  }

  private getStateColor(state?: string): (text: string) => string {
    switch (state) {
      case 'OPEN':
        return (text: string) => this.output.green(text);
      case 'MERGED':
        return (text: string) => this.output.magenta(text);
      case 'DECLINED':
        return (text: string) => this.output.red(text);
      default:
        return (text: string) => this.output.gray(text);
    }
  }
}
