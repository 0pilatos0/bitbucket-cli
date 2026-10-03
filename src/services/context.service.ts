/**
 * Context service for resolving workspace and repository
 */

import type {
  GitRemote,
  IContextService,
  IGitService,
  IConfigService,
} from '../core/interfaces/services.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type { RepoContext, GlobalOptions } from '../types/config.js';

type RepoContextFailureReason =
  'not_a_git_repo' | 'no_remote' | 'remote_not_bitbucket' | 'ambiguous_remote';

interface GitRepoContextResult {
  context: RepoContext | null;
  reason: RepoContextFailureReason | null;
  /** Remotes behind the failure: all of them, or the competing Bitbucket ones */
  remotes: GitRemote[];
}

interface ParsedGitUrl {
  host: string;
  path: string;
  overSsh: boolean;
}

const BITBUCKET_HOSTS = new Set([
  'bitbucket.org',
  'www.bitbucket.org',
  'altssh.bitbucket.org',
]);

// Braces admit the `{uuid}` form Bitbucket accepts in place of either slug.
const PATH_SEGMENT = /^(?!\.+$)[A-Za-z0-9_.{}-]+$/;

/**
 * Split a git remote URL into host and path. Covers `scheme://[user@]host
 * [:port]/path` and the scp-like `[user@]host:path` git also accepts. Like
 * git, a one-letter scp host is a Windows drive, not a remote.
 */
function parseGitUrl(url: string): ParsedGitUrl | null {
  const urlMatch =
    /^(ssh|git\+ssh|ssh\+git|https?|git):\/\/(?:[^@/\s]+@)?([^/:\s]+)(?::\d+)?\/(\S+)$/i.exec(
      url
    );
  if (urlMatch) {
    return {
      host: urlMatch[2]!.toLowerCase(),
      path: urlMatch[3]!,
      overSsh: urlMatch[1]!.toLowerCase().includes('ssh'),
    };
  }

  const scpMatch = /^(?:[^@/\s]+@)?([^/:\s]{2,}):(?!\/)(\S+)$/.exec(url);
  if (scpMatch) {
    return {
      host: scpMatch[1]!.toLowerCase(),
      path: scpMatch[2]!,
      overSsh: true,
    };
  }

  return null;
}

function parseRepoPath(path: string): RepoContext | null {
  const segments = path
    .replace(/\/$/, '')
    .replace(/\.git$/, '')
    .split('/');
  if (segments.length !== 2 || !segments.every((s) => PATH_SEGMENT.test(s))) {
    return null;
  }
  return { workspace: segments[0]!, repoSlug: segments[1]! };
}

function redactUrl(url: string): string {
  return url.replace(/^([a-z+]+:\/\/[^:@/\s]+):[^@/\s]*@/i, '$1:***@');
}

function sameRepo(a: RepoContext, b: RepoContext): boolean {
  return (
    a.workspace.toLowerCase() === b.workspace.toLowerCase() &&
    a.repoSlug.toLowerCase() === b.repoSlug.toLowerCase()
  );
}

export class ContextService implements IContextService {
  constructor(
    private readonly gitService: IGitService,
    private readonly configService: IConfigService
  ) {}

  /**
   * Parse a Bitbucket remote URL (SSH, scp-like or HTTPS) into workspace and
   * repo slug. Returns null for other hosts; SSH host aliases are resolved
   * only by the git-backed lookups.
   */
  public parseRemoteUrl(url: string): RepoContext | null {
    const parsed = parseGitUrl(url);
    if (!parsed || !BITBUCKET_HOSTS.has(parsed.host)) {
      return null;
    }
    return parseRepoPath(parsed.path);
  }

  /**
   * The repository path of a remote whose host is Bitbucket, directly or via
   * an SSH host alias; null for any other host.
   */
  private async bitbucketPath(url: string): Promise<string | null> {
    const parsed = parseGitUrl(url);
    if (!parsed) {
      return null;
    }
    if (BITBUCKET_HOSTS.has(parsed.host)) {
      return parsed.path;
    }
    if (!parsed.overSsh) {
      return null;
    }
    const host = await this.gitService.resolveSshHostname(parsed.host);
    return host && BITBUCKET_HOSTS.has(host.toLowerCase()) ? parsed.path : null;
  }

  /**
   * Get repository context from current git repository
   */
  public async getRepoContextFromGit(): Promise<RepoContext | null> {
    const result = await this.inspectGitRepoContext();
    return result.context;
  }

  /**
   * `origin` wins when it points at Bitbucket. Otherwise use the only
   * Bitbucket repository among the other remotes, preferring `upstream` when
   * they disagree.
   */
  private async inspectGitRepoContext(): Promise<GitRepoContextResult> {
    const isRepo = await this.gitService.isRepository();
    if (!isRepo) {
      return { context: null, reason: 'not_a_git_repo', remotes: [] };
    }

    let remotes: GitRemote[];
    try {
      remotes = await this.gitService.getRemotes();
    } catch {
      remotes = [];
    }
    if (remotes.length === 0) {
      return { context: null, reason: 'no_remote', remotes: [] };
    }

    const origin = remotes.find((r) => r.name === 'origin');
    const originPath = origin ? await this.bitbucketPath(origin.url) : null;
    if (origin && originPath !== null) {
      const context = parseRepoPath(originPath);
      return context
        ? { context, reason: null, remotes: [] }
        : { context: null, reason: 'remote_not_bitbucket', remotes: [origin] };
    }

    const resolved = await Promise.all(
      remotes
        .filter((remote) => remote !== origin)
        .map(async (remote) => {
          const path = await this.bitbucketPath(remote.url);
          return {
            remote,
            context: path === null ? null : parseRepoPath(path),
          };
        })
    );
    const candidates = resolved.filter(
      (c): c is { remote: GitRemote; context: RepoContext } => !!c.context
    );

    const first = candidates[0];
    if (!first) {
      return { context: null, reason: 'remote_not_bitbucket', remotes };
    }
    if (candidates.every((c) => sameRepo(c.context, first.context))) {
      return { context: first.context, reason: null, remotes: [] };
    }
    const upstream = candidates.find((c) => c.remote.name === 'upstream');
    if (upstream) {
      return { context: upstream.context, reason: null, remotes: [] };
    }
    return {
      context: null,
      reason: 'ambiguous_remote',
      remotes: candidates.map((c) => c.remote),
    };
  }

  /**
   * Get repository context with fallbacks:
   * 1. Command line options (--workspace, --repo)
   * 2. Current git repository remote
   * 3. `BB_WORKSPACE` environment variable (paired with `--repo`)
   * 4. `config.defaultWorkspace` (paired with `--repo`)
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
        remotes: [],
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
        remotes: [],
      };
    }

    // If only repo is provided, try to use git workspace or fall back to
    // BB_WORKSPACE / config.defaultWorkspace
    if (options.repo) {
      const workspace =
        gitContext?.workspace ?? (await this.resolveDefaultWorkspace());
      if (workspace) {
        return {
          context: { workspace, repoSlug: options.repo },
          reason: null,
          remotes: [],
        };
      }
    }

    return gitResult;
  }

  /**
   * Resolve a default workspace name from the environment or config file.
   * `BB_WORKSPACE` wins over `config.defaultWorkspace` so CI pipelines can
   * override a developer's persisted default without rewriting the config.
   */
  private async resolveDefaultWorkspace(): Promise<string | undefined> {
    const fromEnv = process.env.BB_WORKSPACE;
    if (typeof fromEnv === 'string') {
      const trimmed = fromEnv.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    const config = await this.configService.getConfig();
    const fromConfig = config.defaultWorkspace;
    if (typeof fromConfig === 'string' && fromConfig.length > 0) {
      return fromConfig;
    }

    return undefined;
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
        message: this.buildRepoNotFoundMessage(result.reason, result.remotes),
        context: {
          reason: result.reason ?? 'unknown',
          ...this.describeRemotes(result.remotes),
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

  /**
   * A lone remote is reported by URL, as before. Several are reported by name
   * only, which keeps the message short and avoids repeating every URL.
   */
  private describeRemotes(
    remotes: GitRemote[]
  ): { remoteUrl: string } | { remotes: string[] } | Record<string, never> {
    if (remotes.length === 1) {
      return { remoteUrl: redactUrl(remotes[0]!.url) };
    }
    if (remotes.length > 1) {
      return { remotes: remotes.map((r) => r.name) };
    }
    return {};
  }

  private buildRepoNotFoundMessage(
    reason: RepoContextFailureReason | null,
    remotes: GitRemote[]
  ): string {
    const fallback =
      'Use --workspace and --repo options, or run this command from within a Bitbucket repository.';
    const names = remotes.map((r) => r.name).join(', ');
    switch (reason) {
      case 'not_a_git_repo':
        return `Not in a git repository. ${fallback}`;
      case 'no_remote':
        return `Git repository has no remote configured. Add a Bitbucket remote with \`git remote add origin <url>\`, or ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}`;
      case 'remote_not_bitbucket':
        return remotes.length === 1
          ? `Remote '${redactUrl(remotes[0]!.url)}' is not a Bitbucket URL. ${fallback}`
          : `None of the git remotes (${names}) is a Bitbucket URL. ${fallback}`;
      case 'ambiguous_remote':
        return `Git remotes ${names} point to different Bitbucket repositories and neither origin nor upstream is one of them. Use --workspace and --repo options to pick one.`;
      default:
        return `Could not determine repository. ${fallback}`;
    }
  }

  /**
   * Resolve workspace for workspace-only commands (e.g. snippets, repo list).
   * Prefers the explicit value, then `BB_WORKSPACE`, then
   * `config.defaultWorkspace`. Throws when none is set.
   */
  public async requireWorkspace(explicit?: string): Promise<string> {
    if (explicit && explicit.length > 0) {
      return explicit;
    }

    const fallback = await this.resolveDefaultWorkspace();
    if (fallback) {
      return fallback;
    }

    throw new BBError({
      code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
      message:
        'No workspace specified. Use --workspace option or set a default workspace with `bb config set defaultWorkspace <name>`.',
    });
  }

  public async resolveWorkspaceFor(
    options: Partial<GlobalOptions>,
    context: CommandContext
  ): Promise<string> {
    return (
      options.workspace ??
      context.globalOptions.workspace ??
      (await this.getRepoContextFromGit())?.workspace ??
      (await this.requireWorkspace())
    );
  }
}
