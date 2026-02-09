/**
 * PR diff command implementation
 */

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pr = Array.from(prsResponse.data.values ?? []).find(
        (p: any) => p.source?.branch?.name === currentBranch
      );

      if (!pr) {
        throw new Error(
          `No open pull request found for branch "${currentBranch}"`
        );
      }

      prId = pr.id!;
    }

    if (options.web) {
      const webUrl = await this.getWebDiffUrl(
        repoContext.workspace,
        repoContext.repoSlug,
        prId
      );
      if (context.globalOptions.json) {
        this.output.json({
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          mode: 'web',
          url: webUrl,
        });
        return;
      }

      await this.openInBrowser(webUrl);
      return;
    }

    if (options.stat) {
      const statResult = await this.showStat(
        repoContext.workspace,
        repoContext.repoSlug,
        prId,
        Boolean(context.globalOptions.json)
      );

      if (context.globalOptions.json) {
        this.output.json({
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          mode: 'stat',
          ...statResult,
        });
      }
      return;
    }

    if (options.nameOnly) {
      const files = await this.showNameOnly(
        repoContext.workspace,
        repoContext.repoSlug,
        prId,
        Boolean(context.globalOptions.json)
      );

      if (context.globalOptions.json) {
        this.output.json({
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          mode: 'name-only',
          files,
        });
      }
      return;
    }

    const diff = await this.showDiff(
      repoContext.workspace,
      repoContext.repoSlug,
      prId,
      options,
      Boolean(context.globalOptions.json)
    );

    if (context.globalOptions.json) {
      this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        mode: 'diff',
        diff,
      });
    }
  }

  private async openInBrowser(url: string): Promise<void> {
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

  private async getWebDiffUrl(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<string> {
    const prResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    const links = prResponse.data.links as
      | { html?: { href?: string } }
      | undefined;
    const htmlUrl = links?.html?.href;
    if (htmlUrl) {
      const normalizedHtmlUrl = htmlUrl.replace(/\/$/, '');
      return `${normalizedHtmlUrl}/diff`;
    }

    return `https://bitbucket.org/${workspace}/${repoSlug}/pull-requests/${prId}/diff`;
  }

  private async showStat(
    workspace: string,
    repoSlug: string,
    prId: number,
    useJson: boolean
  ): Promise<{
    files: Array<{ path: string; additions: number; deletions: number }>;
    filesChanged: number;
    totalAdditions: number;
    totalDeletions: number;
  }> {
    const diffstatResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diffstat = diffstatResponse.data as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const files = Array.from(diffstat.values ?? []).map((file: any) => {
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

    if (useJson) {
      return {
        files,
        filesChanged,
        totalAdditions,
        totalDeletions,
      };
    }

    for (const file of files) {
      const additions =
        file.additions > 0 ? this.output.green(`+${file.additions}`) : '';
      const deletions =
        file.deletions > 0 ? this.output.red(`-${file.deletions}`) : '';
      const stats = [additions, deletions].filter(Boolean).join(' ');
      this.output.text(`${file.path} ${stats ? `| ${stats}` : ''}`);
    }

    this.output.text('');
    const summary = [
      `${filesChanged} file${filesChanged === 1 ? '' : 's'} changed`,
      totalAdditions > 0
        ? this.output.green(
            `${totalAdditions} insertion${totalAdditions === 1 ? '' : 's'}(+)`
          )
        : null,
      totalDeletions > 0
        ? this.output.red(
            `${totalDeletions} deletion${totalDeletions === 1 ? '' : 's'}(-)`
          )
        : null,
    ]
      .filter(Boolean)
      .join(', ');

    this.output.text(summary);

    return {
      files,
      filesChanged,
      totalAdditions,
      totalDeletions,
    };
  }

  private async showNameOnly(
    workspace: string,
    repoSlug: string,
    prId: number,
    useJson: boolean
  ): Promise<string[]> {
    const diffstatResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diffstat = diffstatResponse.data as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileNames = Array.from(diffstat.values ?? []).map(
      (file: any) => file.new?.path || file.old?.path || 'unknown'
    );

    if (useJson) {
      return fileNames;
    }

    for (const fileName of fileNames) {
      this.output.text(fileName);
    }

    return fileNames;
  }

  private async showDiff(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: DiffPROptions,
    useJson: boolean
  ): Promise<string> {
    const diffResponse =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet(
        {
          workspace,
          repoSlug,
          pullRequestId: prId,
        }
      );

    const diff = diffResponse.data;

    const shouldColorize = this.shouldColorize(options.color);
    if (useJson) {
      return String(diff);
    }

    const colorizedDiff = shouldColorize
      ? this.colorizeDiff(String(diff))
      : String(diff);
    this.output.text(colorizedDiff);

    return String(diff);
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
          return this.output.green(line);
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          return this.output.red(line);
        } else if (line.startsWith('@@')) {
          return this.output.cyan(line);
        } else if (line.startsWith('diff --git')) {
          return this.output.bold(line);
        } else if (
          line.startsWith('index ') ||
          line.startsWith('---') ||
          line.startsWith('+++')
        ) {
          return this.output.dim(line);
        }
        return line;
      })
      .join('\n');
  }
}
