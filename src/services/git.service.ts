/**
 * Git service implementation
 */

import type { GitRemote, IGitService } from '../core/interfaces/services.js';
import { GitError } from '../types/errors.js';

export interface GitExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Default timeout for `git` subprocess calls. Network-bound commands like
 * `git clone` or `git fetch` against a slow remote can legitimately take a
 * while, so this default is generous; callers that want a tighter bound can
 * pass `cwd` plus a custom `timeoutMs`.
 */
const DEFAULT_GIT_TIMEOUT_MS = 60_000;

/**
 * `ssh -G` only evaluates local config, so anything slower than this is a
 * hung `Match exec` rule and not worth waiting for.
 */
const SSH_CONFIG_TIMEOUT_MS = 5_000;

const SSH_HOST_ALIAS = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export class GitService implements IGitService {
  private readonly cwd: string;
  private readonly timeoutMs: number;
  private readonly env?: Record<string, string>;

  constructor(
    cwd?: string,
    options: { timeoutMs?: number; env?: Record<string, string> } = {}
  ) {
    this.cwd = cwd ?? process.cwd();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS;
    this.env = options.env;
  }

  private exec(args: string[], cwd?: string): Promise<GitExecResult> {
    return this.spawn(['git', ...args], cwd ?? this.cwd, this.timeoutMs);
  }

  private async spawn(
    argv: string[],
    cwd: string,
    timeoutMs: number
  ): Promise<GitExecResult> {
    const proc = Bun.spawn(argv, {
      cwd,
      env: this.env,
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill();
      } catch {
        // The process may have already exited between the timer firing and
        // the kill landing; that's fine, we surface the timeout below either
        // way.
      }
    }, timeoutMs);

    try {
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (timedOut) {
        throw new GitError(
          `${argv.join(' ')} timed out after ${timeoutMs}ms`,
          argv.join(' '),
          exitCode
        );
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async execOrError(args: string[], cwd?: string): Promise<string> {
    const result = await this.exec(args, cwd);

    if (result.exitCode !== 0) {
      throw new GitError(
        result.stderr || `Git command failed: git ${args.join(' ')}`,
        `git ${args.join(' ')}`,
        result.exitCode
      );
    }

    return result.stdout;
  }

  public async isRepository(): Promise<boolean> {
    const result = await this.exec(['rev-parse', '--is-inside-work-tree']);
    return result.exitCode === 0 && result.stdout === 'true';
  }

  public async clone(url: string, destination?: string): Promise<void> {
    const args = ['clone', url];
    if (destination) {
      args.push(destination);
    }
    await this.execOrError(args);
  }

  public async fetch(remote: string = 'origin'): Promise<void> {
    await this.execOrError(['fetch', remote]);
  }

  public async checkout(branch: string): Promise<void> {
    await this.execOrError(['checkout', branch]);
  }

  public async checkoutNewBranch(
    branch: string,
    startPoint?: string
  ): Promise<void> {
    const args = ['checkout', '-b', branch];
    if (startPoint) {
      args.push(startPoint);
    }
    await this.execOrError(args);
  }

  public async getCurrentBranch(): Promise<string> {
    return this.execOrError(['rev-parse', '--abbrev-ref', 'HEAD']);
  }

  public async getCurrentCommit(): Promise<string> {
    return this.execOrError(['rev-parse', 'HEAD']);
  }

  /**
   * Fetch URLs of all remotes, with `url.<base>.insteadOf` rewrites applied.
   */
  public async getRemotes(): Promise<GitRemote[]> {
    const output = await this.execOrError(['remote', '-v']);
    const remotes: GitRemote[] = [];
    for (const line of output.split('\n')) {
      const match = /^(\S+)\t(.+) \(fetch\)$/.exec(line);
      if (match) {
        remotes.push({ name: match[1]!, url: match[2]! });
      }
    }
    return remotes;
  }

  /**
   * Resolve an SSH host alias (a `Host` entry in `~/.ssh/config`) to the
   * hostname ssh, and therefore git, actually connects to.
   */
  public async resolveSshHostname(host: string): Promise<string | null> {
    if (!SSH_HOST_ALIAS.test(host)) {
      return null;
    }

    try {
      const result = await this.spawn(
        ['ssh', '-G', host],
        this.cwd,
        SSH_CONFIG_TIMEOUT_MS
      );
      if (result.exitCode !== 0) {
        return null;
      }
      return /^hostname\s+(\S+)$/m.exec(result.stdout)?.[1] ?? null;
    } catch {
      // ssh is missing or timed out: treat the alias as unresolvable.
      return null;
    }
  }

  /**
   * Create a new instance with a different working directory
   */
  public withCwd(cwd: string): GitService {
    return new GitService(cwd, {
      timeoutMs: this.timeoutMs,
      env: this.env,
    });
  }
}
