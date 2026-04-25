/**
 * Git service implementation
 */

import type { IGitService } from '../core/interfaces/services.js';
import { GitError, BBError, ErrorCode } from '../types/errors.js';

export interface GitExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class GitService implements IGitService {
  private readonly cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  private async exec(args: string[], cwd?: string): Promise<GitExecResult> {
    const proc = Bun.spawn(['git', ...args], {
      cwd: cwd ?? this.cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
    };
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
    return new GitService(cwd);
  }
}
