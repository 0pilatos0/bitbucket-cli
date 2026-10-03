/**
 * Git service implementation
 */

import type { GitRemote, IGitService } from '../core/interfaces/services.js';
import { GitError, BBError, ErrorCode } from '../types/errors.js';

export interface GitExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Timeout for the quick, local `git` calls whose output we capture. Network
 * commands (clone, fetch) run through `execStreaming()` without a timeout:
 * their duration scales with repository size and the user sees git's own
 * progress, so they can interrupt it themselves.
 */
const DEFAULT_GIT_TIMEOUT_MS = 60_000;

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

  private async exec(args: string[], cwd?: string): Promise<GitExecResult> {
    const proc = Bun.spawn(['git', ...args], {
      cwd: cwd ?? this.cwd,
      env: this.env,
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
    }, this.timeoutMs);

    try {
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (timedOut) {
        throw new GitError(
          `git ${args.join(' ')} timed out after ${this.timeoutMs}ms`,
          `git ${args.join(' ')}`,
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

  /**
   * Run a long-running git command with its progress and errors shown on the
   * user's terminal. git's stdout goes to our stderr so `--json` output stays
   * parseable; stdin is inherited so git can ask for credentials.
   */
  private async execStreaming(args: string[]): Promise<void> {
    const proc = Bun.spawn(['git', ...args], {
      cwd: this.cwd,
      env: this.env,
      stdin: 'inherit',
      stdout: 2,
      stderr: 'inherit',
    });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new GitError(
        `git ${args[0]} failed with exit code ${exitCode}; see git's output above`,
        `git ${args.join(' ')}`,
        exitCode
      );
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
    await this.execStreaming(args);
  }

  public async fetch(remote: string, refspecs: string[] = []): Promise<void> {
    await this.execStreaming(['fetch', remote, ...refspecs]);
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

  public async fastForward(ref: string): Promise<void> {
    await this.execOrError(['merge', '--ff-only', ref]);
  }

  public async branchExists(branch: string): Promise<boolean> {
    const result = await this.exec([
      'show-ref',
      '--verify',
      '--quiet',
      `refs/heads/${branch}`,
    ]);
    return result.exitCode === 0;
  }

  public async isAncestor(
    ancestor: string,
    descendant: string
  ): Promise<boolean> {
    const result = await this.exec([
      'merge-base',
      '--is-ancestor',
      ancestor,
      descendant,
    ]);
    return result.exitCode === 0;
  }

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

  public async getCurrentBranch(): Promise<string> {
    return this.execOrError(['rev-parse', '--abbrev-ref', 'HEAD']);
  }

  public async getCurrentCommit(): Promise<string> {
    return this.execOrError(['rev-parse', 'HEAD']);
  }

  public async getRemoteUrl(remote: string = 'origin'): Promise<string> {
    const result = await this.exec(['remote', 'get-url', remote]);

    if (result.exitCode !== 0) {
      throw new BBError({
        code: ErrorCode.GIT_REMOTE_NOT_FOUND,
        message: `Remote '${remote}' not found`,
        context: { remote },
      });
    }

    return result.stdout;
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
