/**
 * PR checks command implementation
 */

import chalk from 'chalk';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { CommitStatusesApi, Commitstatus } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { toArray } from '../../types/api-helpers.js';

export interface ChecksPROptions extends GlobalOptions {
  json?: boolean;
}

export class ChecksPRCommand extends BaseCommand<
  { id: string } & ChecksPROptions,
  void
> {
  public readonly name = 'checks';
  public readonly description =
    'Show CI/CD checks and build status for a pull request';

  constructor(
    private readonly commitStatusesApi: CommitStatusesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ChecksPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    const response =
      await this.commitStatusesApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const data = response.data;
    const statuses = toArray(data?.values);

    const useJson = options.json || context.globalOptions.json;

    if (useJson) {
      this.output.json({
        pullRequestId: prId,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        statuses: statuses.map((status) => this.formatStatusForJson(status)),
      });
      return;
    }

    if (statuses.length === 0) {
      this.output.info('No CI/CD checks found for this pull request');
      return;
    }

    this.renderHeader(prId, statuses.length);
    this.renderStatuses(statuses);
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
    const title = chalk.bold('Pull Request #' + prId);
    this.output.text(`${title} - ${count} check${count === 1 ? '' : 's'}`);
    this.output.text(chalk.gray('-'.repeat(60)));
  }

  private renderStatuses(statuses: Commitstatus[]): void {
    const rows = statuses.map((status) => {
      const stateIcon = this.getStateIcon(status.state);
      const stateLabel = this.getStateLabel(status.state);
      const name = status.name ?? status.key ?? 'Unknown';
      const description = status.description ?? '-';

      return [
        `${stateIcon} ${stateLabel}`,
        chalk.bold(name),
        this.truncate(description, 40),
        status.updated_on ? this.output.formatDate(status.updated_on) : '-',
      ];
    });

    this.output.table(['STATUS', 'NAME', 'DESCRIPTION', 'UPDATED'], rows);

    // Show summary
    const summary = this.getSummary(statuses);
    this.output.text('');
    this.output.text(
      `${chalk.green('OK')} ${summary.successful} successful, ${chalk.red('FAIL')} ${summary.failed} failed, ${chalk.yellow('RUN')} ${summary.pending} pending`
    );
    this.output.text('');
  }

  private getStateIcon(state?: string): string {
    switch (state?.toUpperCase()) {
      case 'SUCCESSFUL':
        return chalk.green('OK');
      case 'FAILED':
        return chalk.red('FAIL');
      case 'INPROGRESS':
        return chalk.yellow('RUN');
      case 'STOPPED':
        return chalk.gray('STOP');
      default:
        return chalk.gray('?');
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

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
