/**
 * PR diff command implementation
 */

import chalk from 'chalk';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
  IGitService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  getBranchName,
  getLinkHref,
  toArray,
} from '../../types/api-helpers.js';
import {
  parseDiffResponse,
  parseDiffstats,
} from '../../types/api-responses.js';

const execAsync = promisify(exec);

export interface DiffPROptions extends GlobalOptions {
  id?: string;
  color?: 'auto' | 'always' | 'never';
  nameOnly?: boolean;
  stat?: boolean;
  web?: boolean;
}

export class DiffPRCommand extends BaseCommand<DiffPROptions, void> {
  public readonly name = 'diff';
  public readonly description = 'View pull request diff';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DiffPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    let prId: number;
    if (options.id) {
      prId = Number.parseInt(options.id, 10);
      if (Number.isNaN(prId)) {
        throw new TypeError('Invalid PR ID');
      }
    } else {
      const currentBranch = await this.gitService.getCurrentBranch();

      const prsResponse =
        await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
          {
            workspace: repoContext.workspace,
            repoSlug: repoContext.repoSlug,
            state: 'OPEN',
          }
        );

      const pr = toArray(prsResponse.data.values).find(
        (value) => getBranchName(value.source) === currentBranch
      );

      if (!pr) {
        throw new Error(
          `No open pull request found for branch "${currentBranch}"`
        );
      }

      prId = pr.id!;
    }

    if (options.web) {
      const prResponse =
        await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
          {
            workspace: repoContext.workspace,
            repoSlug: repoContext.repoSlug,
            pullRequestId: prId,
          }
        );

      const diffUrl = getLinkHref(prResponse.data.links, 'diff');
      if (!diffUrl) {
        throw new Error('Could not get diff URL');
      }

      const webUrl = diffUrl.replace(
        /api\.bitbucket\.org\/2\.0\/repositories\/(.*?)\/pullrequests\/(\d+)\/diff/,
        'bitbucket.org/$1/pull-requests/$2/diff'
      );

      await this.openInBrowser(webUrl, context);
      return;
    }

    if (options.stat) {
      await this.showStat(
        repoContext.workspace,
        repoContext.repoSlug,
        prId,
        context
      );
      return;
    }

    if (options.nameOnly) {
      await this.showNameOnly(
        repoContext.workspace,
        repoContext.repoSlug,
        prId,
        context
      );
      return;
    }

    await this.showDiff(
      repoContext.workspace,
      repoContext.repoSlug,
      prId,
      options,
      context
    );
  }

  private async openInBrowser(
    url: string,
    context: CommandContext
  ): Promise<void> {
    if (context.globalOptions.json) {
      this.output.json({ url });
      return;
    }

    this.output.info(`Opening ${url} in your browser...`);

    const platform = process.platform;
    let command: string;

    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    await execAsync(command);
  }

  private async showStat(
    workspace: string,
    repoSlug: string,
    prId: number,
    context: CommandContext
  ): Promise<void> {
    const diffstatResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    const diffstat = parseDiffstats(diffstatResponse.data);
    const files = diffstat.map((file) => {
      const path = file.new?.path || file.old?.path || 'unknown';
      return {
        path,
        additions: file.lines_added ?? 0,
        deletions: file.lines_removed ?? 0,
      };
    });

    const totalAdditions = files.reduce(
      (sum: number, f: (typeof files)[0]) => sum + f.additions,
      0
    );
    const totalDeletions = files.reduce(
      (sum: number, f: (typeof files)[0]) => sum + f.deletions,
      0
    );
    const filesChanged = files.length;

    for (const file of files) {
      const additions =
        file.additions > 0 ? chalk.green(`+${file.additions}`) : '';
      const deletions =
        file.deletions > 0 ? chalk.red(`-${file.deletions}`) : '';
      const stats = [additions, deletions].filter(Boolean).join(' ');
      this.output.text(`${file.path} ${stats ? `| ${stats}` : ''}`);
    }

    this.output.text('');
    const summary = [
      `${filesChanged} file${filesChanged === 1 ? '' : 's'} changed`,
      totalAdditions > 0
        ? chalk.green(
            `${totalAdditions} insertion${totalAdditions === 1 ? '' : 's'}(+)`
          )
        : null,
      totalDeletions > 0
        ? chalk.red(
            `${totalDeletions} deletion${totalDeletions === 1 ? '' : 's'}(-)`
          )
        : null,
    ]
      .filter(Boolean)
      .join(', ');

    this.output.text(summary);
  }

  private async showNameOnly(
    workspace: string,
    repoSlug: string,
    prId: number,
    context: CommandContext
  ): Promise<void> {
    const diffstatResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    const diffstat = parseDiffstats(diffstatResponse.data);
    const fileNames = diffstat.map(
      (file) => file.new?.path || file.old?.path || 'unknown'
    );

    for (const fileName of fileNames) {
      this.output.text(fileName);
    }
  }

  private async showDiff(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: DiffPROptions,
    context: CommandContext
  ): Promise<void> {
    const diffResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    const diff = parseDiffResponse(diffResponse.data);

    const shouldColorize = this.shouldColorize(options.color);
    const colorizedDiff = shouldColorize
      ? this.colorizeDiff(String(diff))
      : String(diff);
    this.output.text(colorizedDiff);
  }

  private shouldColorize(colorOption?: 'auto' | 'always' | 'never'): boolean {
    if (!colorOption || colorOption === 'auto') {
      return process.stdout.isTTY ?? false;
    }
    return colorOption === 'always';
  }

  private colorizeDiff(diff: string): string {
    const lines = diff.split('\n');
    return lines
      .map((line) => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          return chalk.green(line);
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          return chalk.red(line);
        } else if (line.startsWith('@@')) {
          return chalk.cyan(line);
        } else if (line.startsWith('diff --git')) {
          return chalk.bold(line);
        } else if (
          line.startsWith('index ') ||
          line.startsWith('---') ||
          line.startsWith('+++')
        ) {
          return chalk.dim(line);
        }
        return line;
      })
      .join('\n');
  }
}
