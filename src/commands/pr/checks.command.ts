/**
 * PR checks command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  CommitStatusesApi,
  Commitstatus,
  PullrequestsApi,
} from '../../generated/api.js';
import { collectPages } from '../../services/pagination.js';
import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  realSleep,
  type Sleep,
} from '../../services/polling.js';
import type { GlobalOptions, RepoContext } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import { findPullRequestIdForCurrentBranch } from './shared.js';

/**
 * Right after a push Bitbucket may not list any check yet; give CI this many
 * extra polls to report one before the watch gives up.
 */
const NO_CHECKS_GRACE_POLLS = 3;

export interface ChecksPROptions extends GlobalOptions {
  watch?: boolean;
  interval?: string;
}

export class ChecksPRCommand extends BaseCommand<
  { id?: string } & ChecksPROptions,
  void
> {
  public readonly name = 'checks';
  public readonly description =
    'Show CI/CD checks and build status for a pull request';

  constructor(
    private readonly commitStatusesApi: CommitStatusesApi,
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService,
    private readonly sleep: Sleep = realSleep
  ) {
    super(output);
  }

  public async execute(
    options: { id?: string } & ChecksPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId =
      options.id !== undefined
        ? this.parsePositiveIntArg(options.id, 'id')
        : await findPullRequestIdForCurrentBranch(
            this.pullrequestsApi,
            this.gitService,
            this.contextService,
            repoContext
          );
    const statuses = options.watch
      ? await this.waitForStatuses(
          repoContext,
          prId,
          this.parsePositiveInt(
            options.interval ?? DEFAULT_POLL_INTERVAL_SECONDS,
            'interval'
          ) * 1000,
          !context.globalOptions.json
        )
      : await this.fetchStatuses(repoContext, prId);
    const summary = this.getSummary(statuses);

    if (context.globalOptions.json) {
      await this.output.json({
        pullRequestId: prId,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        summary,
        statuses: statuses.map((status) => this.formatStatusForJson(status)),
      });
    } else if (statuses.length === 0) {
      this.output.info('No CI/CD checks found for this pull request');
    } else {
      this.renderHeader(prId, statuses.length);
      this.renderStatuses(statuses, summary);
    }

    if (options.watch) {
      this.failIfUnsuccessful(prId, statuses);
    }
  }

  /** Every status page: a check on page 2 still decides whether CI is done. */
  private async fetchStatuses(
    repoContext: RepoContext,
    prId: number
  ): Promise<Commitstatus[]> {
    return collectPages<Commitstatus>({
      limit: Number.POSITIVE_INFINITY,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.commitStatusesApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet(
            {
              workspace: repoContext.workspace,
              repoSlug: repoContext.repoSlug,
              pullRequestId: prId,
            },
            { params: { page, pagelen } }
          );
        return response.data;
      },
    });
  }

  /**
   * Poll until at least one check exists and none is `INPROGRESS`, printing
   * one line per check whose state changes after the first poll.
   */
  private async waitForStatuses(
    repoContext: RepoContext,
    prId: number,
    intervalMs: number,
    showProgress: boolean
  ): Promise<Commitstatus[]> {
    const seen = new Map<string, string | undefined>();
    for (let poll = 0; ; poll++) {
      if (poll > 0) {
        await this.sleep(intervalMs);
      }
      const statuses = await this.fetchStatuses(repoContext, prId);
      const pending = this.getSummary(statuses).pending;

      if (showProgress) {
        if (poll === 0 && statuses.length === 0) {
          this.output.text(
            `Waiting for checks to be reported on pull request #${prId}...`
          );
        }
        if (poll === 0 && pending > 0) {
          this.output.text(
            `Waiting for ${pending} of ${statuses.length} check${statuses.length === 1 ? '' : 's'} on pull request #${prId}...`
          );
        }
        for (const status of statuses) {
          const key = status.key ?? status.uuid ?? status.name ?? '';
          if (poll > 0 && seen.get(key) !== status.state) {
            this.output.text(
              `  ${this.getStateIcon(status.state)} ${status.name ?? status.key ?? 'Unknown'} ${this.getStateLabel(status.state)}`
            );
          }
          seen.set(key, status.state);
        }
      }

      if (statuses.length === 0 && poll < NO_CHECKS_GRACE_POLLS) {
        continue;
      }
      if (pending === 0) {
        return statuses;
      }
    }
  }

  private failIfUnsuccessful(prId: number, statuses: Commitstatus[]): void {
    if (statuses.length === 0) {
      throw new BBError({
        code: ErrorCode.CI_FAILED,
        message: `No checks were reported on pull request #${prId}.`,
        context: { pullRequestId: prId },
      });
    }
    const unsuccessful = statuses.filter((status) =>
      ['FAILED', 'STOPPED'].includes(status.state?.toUpperCase() ?? '')
    );
    if (unsuccessful.length === 0) {
      return;
    }
    throw new BBError({
      code: ErrorCode.CI_FAILED,
      message: `${unsuccessful.length} check${unsuccessful.length === 1 ? '' : 's'} did not pass on pull request #${prId}: ${unsuccessful
        .map((status) => status.name ?? status.key ?? 'Unknown')
        .join(', ')}.`,
      context: { pullRequestId: prId },
    });
  }

  private formatStatusForJson(status: Commitstatus): Record<string, unknown> {
    return {
      key: status.key,
      name: status.name,
      state: status.state,
      description: status.description,
      url: status.url,
      refname: status.refname,
      createdOn: status.created_on,
      updatedOn: status.updated_on,
      uuid: status.uuid,
    };
  }

  private renderHeader(prId: number, count: number): void {
    this.output.text('');
    const title = this.output.bold('Pull Request #' + prId);
    this.output.text(`${title} - ${count} check${count === 1 ? '' : 's'}`);
    this.output.separator();
  }

  private renderStatuses(
    statuses: Commitstatus[],
    summary: { successful: number; failed: number; pending: number }
  ): void {
    const rows = statuses.map((status) => {
      const stateIcon = this.getStateIcon(status.state);
      const stateLabel = this.getStateLabel(status.state);
      const name = status.name ?? status.key ?? 'Unknown';
      const description = status.description ?? '-';

      return [
        `${stateIcon} ${stateLabel}`,
        this.output.bold(name),
        description,
        status.updated_on
          ? this.output.formatRelativeDate(status.updated_on)
          : '-',
      ];
    });

    this.output.table(['STATUS', 'NAME', 'DESCRIPTION', 'UPDATED'], rows, {
      flexColumns: [1, 2],
    });

    // Show summary
    this.output.text('');
    this.output.text(
      `${this.output.green('OK')} ${summary.successful} successful, ${this.output.red('FAIL')} ${summary.failed} failed, ${this.output.yellow('RUN')} ${summary.pending} pending`
    );
    this.output.text('');
  }

  private getStateIcon(state?: string): string {
    switch (state?.toUpperCase()) {
      case 'SUCCESSFUL':
        return this.output.green('OK');
      case 'FAILED':
        return this.output.red('FAIL');
      case 'INPROGRESS':
        return this.output.yellow('RUN');
      case 'STOPPED':
        return this.output.gray('STOP');
      default:
        return this.output.gray('?');
    }
  }

  private getStateLabel(state?: string): string {
    switch (state?.toUpperCase()) {
      case 'SUCCESSFUL':
        return 'passed';
      case 'FAILED':
        return 'failed';
      case 'INPROGRESS':
        return 'running';
      case 'STOPPED':
        return 'stopped';
      default:
        return state?.toLowerCase() ?? 'unknown';
    }
  }

  private getSummary(statuses: Commitstatus[]): {
    successful: number;
    failed: number;
    pending: number;
  } {
    return statuses.reduce(
      (acc, status) => {
        const state = status.state?.toUpperCase();
        if (state === 'SUCCESSFUL') {
          acc.successful++;
        } else if (state === 'FAILED') {
          acc.failed++;
        } else if (state === 'INPROGRESS') {
          acc.pending++;
        }
        return acc;
      },
      { successful: 0, failed: 0, pending: 0 }
    );
  }
}
