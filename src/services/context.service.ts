/**
 * Context service for resolving workspace and repository
 */

import type {
  IContextService,
  IGitService,
  IConfigService,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type { RepoContext, GlobalOptions } from '../types/config.js';

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
    const sshMatch = new RegExp(
      /git@bitbucket\.org:([^/]+)\/([^.]+)(?:\.git)?/
    ).exec(url);
    if (sshMatch) {
      return {
        workspace: sshMatch[1]!,
        repoSlug: sshMatch[2]!,
      };
    }

    // HTTPS format: https://bitbucket.org/workspace/repo.git
    // or: https://username@bitbucket.org/workspace/repo.git
    const httpsMatch = new RegExp(
      /https?:\/\/(?:[^@]+@)?bitbucket\.org\/([^/]+)\/([^/.]+)(?:\.git)?/
    ).exec(url);
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
    const isRepo = await this.gitService.isRepository();
    if (!isRepo) {
      return null;
    }

    try {
      const remoteUrl = await this.gitService.getRemoteUrl();
      return this.parseRemoteUrl(remoteUrl);
    } catch {
      // No remote configured - that's okay, just return null
      return null;
    }
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
    // If both workspace and repo are provided via options, use them
    if (options.workspace && options.repo) {
      return {
        workspace: options.workspace,
        repoSlug: options.repo,
      };
    }

    // Try to get from current git repo
    const gitContext = await this.getRepoContextFromGit();

    // If only workspace is provided, use it with git-detected repo
    if (options.workspace && gitContext) {
      return {
        workspace: options.workspace,
        repoSlug: gitContext.repoSlug,
      };
    }

    // If only repo is provided, try to use default workspace or git workspace
    if (options.repo) {
      const config = await this.configService.getConfig();
      const workspace = gitContext?.workspace || config.defaultWorkspace;
      if (workspace) {
        return {
          workspace,
          repoSlug: options.repo,
        };
      }
    }

    // Fall back to git context
    return gitContext;
  }

  /**
   * Require repository context or throw error
   */
  public async requireRepoContext(
    options: GlobalOptions
  ): Promise<RepoContext> {
    const context = await this.getRepoContext(options);

    if (!context) {
      throw new BBError({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        message:
          'Could not determine repository. Use --workspace and --repo options, ' +
          'or run this command from within a Bitbucket repository.',
      });
    }

    return context;
  }
}
