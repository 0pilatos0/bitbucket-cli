/**
 * Context service for resolving workspace and repository
 */

import type {
  IContextService,
  IGitService,
  IConfigService,
} from '../core/interfaces/services.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type { RepoContext, GlobalOptions } from '../types/config.js';

type RepoContextFailureReason =
  | 'not_a_git_repo'
  | 'no_remote'
  | 'remote_not_bitbucket';

interface GitRepoContextResult {
  context: RepoContext | null;
  reason: RepoContextFailureReason | null;
  remoteUrl: string | null;
}

export class ContextService implements IContextService {
  constructor(
    private readonly gitService: IGitService,
    private readonly configService: IConfigService
  ) {}

  /**
   * Parse Bitbucket repository URL to extract workspace and repo slug
   * Supports both SSH and HTTPS formats
   */
  public parseRemoteUrl(url: string): RepoContext | null {
    // SSH format: git@bitbucket.org:workspace/repo.git
    const sshMatch =
      /^git@bitbucket\.org:([^/\s]+)\/([^/\s.]+)(?:\.git)?$/.exec(url);
    if (sshMatch) {
      return {
        workspace: sshMatch[1]!,
        repoSlug: sshMatch[2]!,
      };
    }

    // HTTPS format: https://bitbucket.org/workspace/repo.git
    // or: https://username@bitbucket.org/workspace/repo.git
    const httpsMatch =
      /^https?:\/\/(?:[^@\s]+@)?bitbucket\.org\/([^/\s]+)\/([^/\s.]+)(?:\.git)?$/.exec(
        url
      );
    if (httpsMatch) {
      return {
        workspace: httpsMatch[1]!,
        repoSlug: httpsMatch[2]!,
      };
    }

    return null;
  }

  /**
   * Get repository context from current git repository
   */
  public async getRepoContextFromGit(): Promise<RepoContext | null> {
    const result = await this.inspectGitRepoContext();
    return result.context;
  }

  private async inspectGitRepoContext(): Promise<GitRepoContextResult> {
    const isRepo = await this.gitService.isRepository();
    if (!isRepo) {
      return { context: null, reason: 'not_a_git_repo', remoteUrl: null };
    }

    let remoteUrl: string;
    try {
      remoteUrl = await this.gitService.getRemoteUrl();
    } catch {
      return { context: null, reason: 'no_remote', remoteUrl: null };
    }

    const context = this.parseRemoteUrl(remoteUrl);
    if (!context) {
      return { context: null, reason: 'remote_not_bitbucket', remoteUrl };
    }
    return { context, reason: null, remoteUrl };
  }

  /**
   * Get repository context with fallbacks:
   * 1. Command line options (--workspace, --repo)
   * 2. Current git repository remote
   * 3. Config file defaults
   */
  public async getRepoContext(
    options: GlobalOptions
  ): Promise<RepoContext | null> {
    const result = await this.resolveRepoContext(options);
    return result.context;
  }

  private async resolveRepoContext(
    options: GlobalOptions
  ): Promise<GitRepoContextResult> {
    // If both workspace and repo are provided via options, use them
    if (options.workspace && options.repo) {
      return {
        context: { workspace: options.workspace, repoSlug: options.repo },
        reason: null,
        remoteUrl: null,
      };
    }

    // Try to get from current git repo
    const gitResult = await this.inspectGitRepoContext();
    const gitContext = gitResult.context;

    // If only workspace is provided, use it with git-detected repo
    if (options.workspace && gitContext) {
      return {
        context: {
          workspace: options.workspace,
          repoSlug: gitContext.repoSlug,
        },
        reason: null,
        remoteUrl: gitResult.remoteUrl,
      };
    }

    // If only repo is provided, try to use default workspace or git workspace
    if (options.repo) {
      const config = await this.configService.getConfig();
      const workspace = gitContext?.workspace || config.defaultWorkspace;
      if (workspace) {
        return {
          context: { workspace, repoSlug: options.repo },
          reason: null,
          remoteUrl: gitResult.remoteUrl,
        };
      }
    }

    return gitResult;
  }

  /**
   * Require repository context or throw error
   */
  public async requireRepoContext(
    options: GlobalOptions
  ): Promise<RepoContext> {
    const result = await this.resolveRepoContext(options);

    if (!result.context) {
      throw new BBError({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        message: this.buildRepoNotFoundMessage(result.reason, result.remoteUrl),
        context: {
          reason: result.reason ?? 'unknown',
          ...(result.remoteUrl ? { remoteUrl: result.remoteUrl } : {}),
        },
      });
    }

    return result.context;
  }

  public async requireRepoContextFor(
    options: Partial<GlobalOptions>,
    context: CommandContext
  ): Promise<RepoContext> {
    return this.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });
  }

  private buildRepoNotFoundMessage(
    reason: RepoContextFailureReason | null,
    remoteUrl: string | null
  ): string {
    const fallback =
      'Use --workspace and --repo options, or run this command from within a Bitbucket repository.';
    switch (reason) {
      case 'not_a_git_repo':
        return `Not in a git repository. ${fallback}`;
      case 'no_remote':
        return `Git repository has no remote configured. Add a Bitbucket remote with \`git remote add origin <url>\`, or ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}`;
      case 'remote_not_bitbucket':
        return `Remote ${remoteUrl ? `'${remoteUrl}' ` : ''}is not a Bitbucket URL. ${fallback}`;
      default:
        return `Could not determine repository. ${fallback}`;
    }
  }

  /**
   * Resolve workspace for workspace-only commands (e.g. snippets, repo list).
   * Prefers the explicit value, falls back to `config.defaultWorkspace`, and
   * throws when neither is set.
   */
  public async requireWorkspace(explicit?: string): Promise<string> {
    if (explicit && explicit.length > 0) {
      return explicit;
    }

    const config = await this.configService.getConfig();
    if (config.defaultWorkspace && config.defaultWorkspace.length > 0) {
      return config.defaultWorkspace;
    }

    throw new BBError({
      code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
      message:
        'No workspace specified. Use --workspace option or set a default workspace with `bb config set defaultWorkspace <name>`.',
    });
  }
}
