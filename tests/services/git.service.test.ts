/**
 * GitService tests
 *
 * These tests spawn real `git` subprocesses. To stay hermetic and
 * deterministic regardless of the developer's machine (issue #269), every
 * spawn runs with:
 * - a fresh temp directory (mkdtemp) as the working tree,
 * - GIT_CONFIG_NOSYSTEM + system/global config pointed at an isolated file
 *   that pins `init.defaultBranch = main`,
 * - an isolated HOME, and fixed author/committer identities.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GitService } from '../../src/services/git.service.js';
import { ErrorCode } from '../../src/types/errors.js';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GIT_ENV_KEYS = [
  'HOME',
  'GIT_CONFIG_NOSYSTEM',
  'GIT_CONFIG_GLOBAL',
  'GIT_CONFIG_SYSTEM',
  'GIT_AUTHOR_NAME',
  'GIT_AUTHOR_EMAIL',
  'GIT_COMMITTER_NAME',
  'GIT_COMMITTER_EMAIL',
  'GIT_TERMINAL_PROMPT',
] as const;

const originalEnv: Record<string, string | undefined> = {};
for (const key of GIT_ENV_KEYS) {
  originalEnv[key] = process.env[key];
}

const HERMETIC_GLOBAL_CONFIG = `[init]
    defaultBranch = main
[user]
    name = Test Author
    email = test@test.com
`;

/**
 * Spawn git with the hermetic environment, asserting a clean exit. `env` is
 * passed explicitly because Bun.spawn does not inherit `process.env`
 * mutations made at runtime on this Bun version.
 */
describe('GitService', () => {
  let testDir: string;
  let hermeticHome: string;
  let gitService: GitService;

  function hermeticEnv(): Record<string, string> {
    return {
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: join(hermeticHome, '.gitconfig'),
      GIT_CONFIG_SYSTEM: join(hermeticHome, 'system-gitconfig'),
      HOME: hermeticHome,
      GIT_AUTHOR_NAME: 'Test Author',
      GIT_AUTHOR_EMAIL: 'test@test.com',
      GIT_COMMITTER_NAME: 'Test Committer',
      GIT_COMMITTER_EMAIL: 'test@test.com',
      GIT_TERMINAL_PROMPT: '0',
    };
  }

  async function git(args: string[], cwd: string): Promise<void> {
    const proc = Bun.spawn(['git', ...args], {
      cwd,
      env: hermeticEnv(),
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const exited = await proc.exited;
    if (exited !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`git ${args.join(' ')} failed (${exited}): ${stderr}`);
    }
  }

  /** Init a repo in `cwd` with a first commit, using the hermetic identity. */
  async function initRepoWithCommit(cwd: string): Promise<void> {
    await git(['init'], cwd);
    await writeFile(join(cwd, 'test.txt'), 'test');
    await git(['add', '.'], cwd);
    await git(['commit', '-m', 'Initial'], cwd);
  }

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'bb-git-test-'));
    hermeticHome = await mkdtemp(join(tmpdir(), 'bb-git-home-'));

    process.env.GIT_CONFIG_NOSYSTEM = '1';
    process.env.GIT_CONFIG_GLOBAL = join(hermeticHome, '.gitconfig');
    process.env.GIT_CONFIG_SYSTEM = join(hermeticHome, 'system-gitconfig');
    process.env.HOME = hermeticHome;
    process.env.GIT_AUTHOR_NAME = 'Test Author';
    process.env.GIT_AUTHOR_EMAIL = 'test@test.com';
    process.env.GIT_COMMITTER_NAME = 'Test Committer';
    process.env.GIT_COMMITTER_EMAIL = 'test@test.com';
    process.env.GIT_TERMINAL_PROMPT = '0';
    await writeFile(process.env.GIT_CONFIG_GLOBAL, HERMETIC_GLOBAL_CONFIG);

    gitService = new GitService(testDir);
  });

  afterEach(async () => {
    for (const key of GIT_ENV_KEYS) {
      const original = originalEnv[key];
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
    try {
      await rm(testDir, { recursive: true, force: true });
      await rm(hermeticHome, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('isRepository', () => {
    it('should return false for non-git directory', async () => {
      const result = await gitService.isRepository();

      expect(result).toBe(false);
    });

    it('should return true for git directory', async () => {
      await git(['init'], testDir);

      const result = await gitService.isRepository();

      expect(result).toBe(true);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      await initRepoWithCommit(testDir);

      const branch = await gitService.getCurrentBranch();

      // Pinned via the hermetic global config — deterministic on all machines.
      expect(branch).toBe('main');
    });

    it('should throw error for non-git directory', async () => {
      await expect(gitService.getCurrentBranch()).rejects.toMatchObject({
        code: ErrorCode.GIT_COMMAND_FAILED,
      });
    });
  });

  describe('getCurrentCommit', () => {
    it('should return the current commit SHA', async () => {
      await initRepoWithCommit(testDir);

      const sha = await gitService.getCurrentCommit();

      expect(sha).toMatch(/^[0-9a-f]{40}$/);
    });

    it('should throw error for non-git directory', async () => {
      await expect(gitService.getCurrentCommit()).rejects.toMatchObject({
        code: ErrorCode.GIT_COMMAND_FAILED,
      });
    });
  });

  describe('getRemoteUrl', () => {
    it('should throw error when no remote exists', async () => {
      await git(['init'], testDir);

      await expect(gitService.getRemoteUrl('origin')).rejects.toMatchObject({
        code: ErrorCode.GIT_REMOTE_NOT_FOUND,
      });
    });

    it('should return remote URL when exists', async () => {
      await git(['init'], testDir);
      await git(
        ['remote', 'add', 'origin', 'git@bitbucket.org:workspace/repo.git'],
        testDir
      );

      const url = await gitService.getRemoteUrl('origin');

      expect(url).toBe('git@bitbucket.org:workspace/repo.git');
    });

    it('should support different remote names', async () => {
      await git(['init'], testDir);
      await git(
        ['remote', 'add', 'upstream', 'https://bitbucket.org/other/repo.git'],
        testDir
      );

      const url = await gitService.getRemoteUrl('upstream');

      expect(url).toBe('https://bitbucket.org/other/repo.git');
    });
  });

  describe('checkout', () => {
    it('should checkout existing branch', async () => {
      await initRepoWithCommit(testDir);
      await git(['branch', 'feature'], testDir);

      await gitService.checkout('feature');

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('feature');
    });

    it('should throw error for non-existent branch', async () => {
      await initRepoWithCommit(testDir);

      await expect(gitService.checkout('nonexistent')).rejects.toBeDefined();
    });
  });

  describe('checkoutNewBranch', () => {
    it('should create and checkout new branch', async () => {
      await initRepoWithCommit(testDir);

      await gitService.checkoutNewBranch('new-feature');

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('new-feature');
    });

    it('should create branch from specific start point', async () => {
      await initRepoWithCommit(testDir);

      // Get current commit hash
      const proc = Bun.spawn(['git', 'rev-parse', 'HEAD'], {
        cwd: testDir,
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const commitHash = (await new Response(proc.stdout).text()).trim();

      await gitService.checkoutNewBranch('from-commit', commitHash);

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('from-commit');
    });

    it('should fail if branch already exists', async () => {
      await initRepoWithCommit(testDir);
      await git(['branch', 'existing'], testDir);

      await expect(
        gitService.checkoutNewBranch('existing')
      ).rejects.toBeDefined();
    });
  });

  describe('fetch', () => {
    it('should throw error when no remote exists', async () => {
      await git(['init'], testDir);

      await expect(gitService.fetch('origin')).rejects.toBeDefined();
    });
  });

  describe('clone', () => {
    it('should clone repository', async () => {
      // Create a bare repo to clone from
      const bareDir = join(testDir, 'bare.git');
      await git(['init', '--bare', bareDir], testDir);

      const cloneDir = join(testDir, 'cloned');
      await gitService.clone(bareDir, cloneDir);

      // Verify the clone worked by checking if it's a git repo
      const clonedGitService = new GitService(cloneDir);
      const isRepo = await clonedGitService.isRepository();
      expect(isRepo).toBe(true);
    });

    it('should handle clone with destination directory', async () => {
      const bareDir = join(testDir, 'bare2.git');
      await git(['init', '--bare', bareDir], testDir);

      const cloneDir = join(testDir, 'cloned-with-dest');
      await gitService.clone(bareDir, cloneDir);

      // Verify the clone worked
      const clonedGitService = new GitService(cloneDir);
      const isRepo = await clonedGitService.isRepository();
      expect(isRepo).toBe(true);
    });
  });

  describe('withCwd', () => {
    it('should create new instance with different cwd', async () => {
      const otherDir = join(testDir, 'other');
      await mkdir(otherDir, { recursive: true });
      await git(['init'], otherDir);

      const otherService = gitService.withCwd(otherDir);
      const result = await otherService.isRepository();

      expect(result).toBe(true);
    });

    it('should not affect original instance', async () => {
      const otherDir = join(testDir, 'other');
      await mkdir(otherDir, { recursive: true });
      await git(['init'], otherDir);

      gitService.withCwd(otherDir);

      // Original should still be non-git directory
      const result = await gitService.isRepository();
      expect(result).toBe(false);
    });
  });
});
