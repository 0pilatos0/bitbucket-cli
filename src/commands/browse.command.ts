/**
 * Browse command implementation.
 *
 * Resolves a Bitbucket Cloud web URL from a positional target and/or
 * resource flags, then either opens it in the user's browser or prints
 * it to stdout. Mirrors `gh browse`.
 */

import { BaseCommand } from '../core/base-command.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../core/interfaces/services.js';
import type { IUrlBuilderService } from '../services/url-builder.service.js';
import type { GlobalOptions, RepoContext } from '../types/config.js';
import { BBError, ErrorCode } from '../types/errors.js';

export interface BrowseOptions extends GlobalOptions {
  target?: string;
  pr?: string;
  prs?: boolean;
  pullRequests?: boolean;
  branch?: string;
  branches?: boolean;
  commit?: string | boolean;
  commits?: boolean;
  pipelines?: boolean;
  pipeline?: string;
  downloads?: boolean;
  issue?: string;
  issues?: boolean;
  wiki?: boolean;
  settings?: boolean;
  /**
   * Commander coerces `-n, --no-browser` into `browser: false`. Treat any
   * non-undefined falsey value as "print URL only".
   */
  browser?: boolean;
}

export interface BrowseResult {
  url: string;
  opened: boolean;
}

const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const PR_NUMBER_PATTERN = /^\d+$/;
const PATH_LINE_PATTERN = /^(.+):(\d+)$/;

export class BrowseCommand extends BaseCommand<BrowseOptions, BrowseResult> {
  public readonly name = 'browse';
  public readonly description =
    'Open a Bitbucket page (repo, file, PR, commit, etc.) in your browser';

  constructor(
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    private readonly urlBuilder: IUrlBuilderService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: BrowseOptions,
    context: CommandContext
  ): Promise<BrowseResult> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    this.validateFlagCombination(options);

    const url = await this.resolveUrl(options, repoContext);
    const useJson = Boolean(context.globalOptions.json);
    const printOnly = options.browser === false;

    if (useJson) {
      await this.output.json({ url });
      return { url, opened: false };
    }

    if (printOnly) {
      this.output.text(url);
      return { url, opened: false };
    }

    await this.openInBrowser(url);
    return { url, opened: true };
  }

  private async resolveUrl(
    options: BrowseOptions,
    ctx: RepoContext
  ): Promise<string> {
    if (options.pr !== undefined) {
      return this.urlBuilder.pullRequest(
        ctx,
        this.parsePositiveInt(options.pr, 'pr')
      );
    }
    if (options.prs || options.pullRequests) {
      return this.urlBuilder.pullRequestList(ctx);
    }
    if (options.branches) {
      return this.urlBuilder.branchList(ctx);
    }
    if (options.commits) {
      return this.urlBuilder.commitList(ctx);
    }
    if (options.commit !== undefined) {
      const sha =
        typeof options.commit === 'string' && options.commit.length > 0
          ? options.commit
          : await this.gitService.getCurrentCommit();
      return this.urlBuilder.commit(ctx, sha);
    }
    if (options.pipelines) {
      return this.urlBuilder.pipelinesHome(ctx);
    }
    if (options.pipeline !== undefined) {
      const value = options.pipeline.trim();
      if (value.length === 0) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: this.appendHelpHint('--pipeline requires a run id or uuid.'),
        });
      }
      return this.urlBuilder.pipelineRun(ctx, value);
    }
    if (options.downloads) {
      return this.urlBuilder.downloads(ctx);
    }
    if (options.issue !== undefined) {
      return this.urlBuilder.issue(
        ctx,
        this.parsePositiveInt(options.issue, 'issue')
      );
    }
    if (options.issues) {
      return this.urlBuilder.issueList(ctx);
    }
    if (options.wiki) {
      return this.urlBuilder.wiki(ctx);
    }
    if (options.settings) {
      return this.urlBuilder.settings(ctx);
    }

    const target = options.target?.trim();

    if (target && target.length > 0) {
      if (PR_NUMBER_PATTERN.test(target)) {
        return this.urlBuilder.pullRequest(ctx, Number.parseInt(target, 10));
      }
      if (SHA_PATTERN.test(target)) {
        return this.urlBuilder.commit(ctx, target);
      }

      const { path, line } = this.parsePathWithLine(target);
      const branch = await this.resolveBranch(options.branch);
      return this.urlBuilder.src(ctx, branch, path, line);
    }

    if (options.branch) {
      return this.urlBuilder.src(ctx, options.branch);
    }

    return this.urlBuilder.repo(ctx);
  }

  private validateFlagCombination(options: BrowseOptions): void {
    const setFlags: string[] = [];
    if (options.pr !== undefined) setFlags.push('--pr');
    if (options.prs) {
      setFlags.push('--prs');
    } else if (options.pullRequests) {
      setFlags.push('--pull-requests');
    }
    if (options.branches) setFlags.push('--branches');
    if (options.commit !== undefined) setFlags.push('--commit');
    if (options.commits) setFlags.push('--commits');
    if (options.pipelines) setFlags.push('--pipelines');
    if (options.pipeline !== undefined) setFlags.push('--pipeline');
    if (options.downloads) setFlags.push('--downloads');
    if (options.issue !== undefined) setFlags.push('--issue');
    if (options.issues) setFlags.push('--issues');
    if (options.wiki) setFlags.push('--wiki');
    if (options.settings) setFlags.push('--settings');

    if (setFlags.length > 1) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          `Cannot combine ${setFlags.join(' and ')}; pick one resource.`
        ),
      });
    }

    const hasResourceFlag = setFlags.length === 1;
    const hasTarget = !!options.target?.trim();

    if (hasResourceFlag && hasTarget) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          `Cannot use a positional target with ${setFlags[0]}.`
        ),
      });
    }

    if (hasResourceFlag && options.branch) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          `Cannot combine --branch with ${setFlags[0]}.`
        ),
      });
    }
  }

  private parsePathWithLine(target: string): {
    path: string;
    line?: number;
  } {
    const match = PATH_LINE_PATTERN.exec(target);
    if (match) {
      const line = Number.parseInt(match[2]!, 10);
      if (Number.isFinite(line) && line > 0) {
        return { path: match[1]!, line };
      }
    }
    return { path: target };
  }

  private async resolveBranch(explicit?: string): Promise<string> {
    if (explicit && explicit.length > 0) {
      return explicit;
    }
    try {
      return await this.gitService.getCurrentBranch();
    } catch {
      // Outside a git checkout, Bitbucket resolves `HEAD` to the repo's
      // default branch server-side, so falling back to that keeps a path
      // browse useful even with `--workspace`/`--repo` overrides.
      return 'HEAD';
    }
  }

  private parsePositiveInt(value: string, name: string): number {
    const parsed = Number.parseInt(value, 10);
    if (
      !Number.isFinite(parsed) ||
      parsed <= 0 ||
      String(parsed) !== value.trim()
    ) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(`--${name} must be a positive integer.`),
        context: { [name]: value },
      });
    }
    return parsed;
  }

  private async openInBrowser(url: string): Promise<void> {
    this.output.info(`Opening ${url} in your browser...`);
    const open = (await import('open')).default;
    await open(url);
  }
}
