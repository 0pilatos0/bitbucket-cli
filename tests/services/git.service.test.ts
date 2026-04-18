/**
 * GitService tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GitService } from '../../src/services/git.service.js';
import { ErrorCode } from '../../src/types/errors.js';
import { mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('GitService', () => {
  const testDir = join(tmpdir(), `bb-git-test-${Date.now()}`);
  let gitService: GitService;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    gitService = new GitService(testDir);
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
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
      // Initialize a git repo
      const proc = Bun.spawn(['git', 'init'], { cwd: testDir });
      await proc.exited;

      const result = await gitService.isRepository();

      expect(result).toBe(true);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      // Initialize git repo with a commit
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;

      const branch = await gitService.getCurrentBranch();

      // Could be 'main' or 'master' depending on git config
      expect(['main', 'master']).toContain(branch);
    });

    it('should throw error for non-git directory', async () => {
      await expect(gitService.getCurrentBranch()).rejects.toMatchObject({
        code: ErrorCode.GIT_COMMAND_FAILED,
      });
    });
  });

  describe('getRemoteUrl', () => {
    it('should throw error when no remote exists', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;

      await expect(gitService.getRemoteUrl('origin')).rejects.toMatchObject({
        code: ErrorCode.GIT_REMOTE_NOT_FOUND,
      });
    });

    it('should return remote URL when exists', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(
        [
          'git',
          'remote',
          'add',
          'origin',
          'git@bitbucket.org:workspace/repo.git',
        ],
        { cwd: testDir }
      ).exited;

      const url = await gitService.getRemoteUrl('origin');

      expect(url).toBe('git@bitbucket.org:workspace/repo.git');
    });

    it('should support different remote names', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(
        [
          'git',
          'remote',
          'add',
          'upstream',
          'https://bitbucket.org/other/repo.git',
        ],
        { cwd: testDir }
      ).exited;

      const url = await gitService.getRemoteUrl('upstream');

      expect(url).toBe('https://bitbucket.org/other/repo.git');
    });
  });

  describe('checkout', () => {
    it('should checkout existing branch', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;
      await Bun.spawn(['git', 'branch', 'feature'], { cwd: testDir }).exited;

      await gitService.checkout('feature');

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('feature');
    });

    it('should throw error for non-existent branch', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;

      await expect(gitService.checkout('nonexistent')).rejects.toBeDefined();
    });
  });

  describe('checkoutNewBranch', () => {
    it('should create and checkout new branch', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;

      await gitService.checkoutNewBranch('new-feature');

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('new-feature');
    });

    it('should create branch from specific start point', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;

      // Get current commit hash
      const proc = Bun.spawn(['git', 'rev-parse', 'HEAD'], {
        cwd: testDir,
        stdout: 'pipe',
      });
      const commitHash = (await new Response(proc.stdout).text()).trim();

      await gitService.checkoutNewBranch('from-commit', commitHash);

      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('from-commit');
    });

    it('should fail if branch already exists', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'config', 'user.email', 'test@test.com'], {
        cwd: testDir,
      }).exited;
      await Bun.spawn(['git', 'config', 'user.name', 'Test'], { cwd: testDir })
        .exited;
      await writeFile(join(testDir, 'test.txt'), 'test');
      await Bun.spawn(['git', 'add', '.'], { cwd: testDir }).exited;
      await Bun.spawn(['git', 'commit', '-m', 'Initial'], { cwd: testDir })
        .exited;
      await Bun.spawn(['git', 'branch', 'existing'], { cwd: testDir }).exited;

      await expect(
        gitService.checkoutNewBranch('existing')
      ).rejects.toBeDefined();
    });
  });

  describe('fetch', () => {
    it('should throw error when no remote exists', async () => {
      await Bun.spawn(['git', 'init'], { cwd: testDir }).exited;

      await expect(gitService.fetch('origin')).rejects.toBeDefined();
    });
  });

  describe('clone', () => {
    it('should clone repository', async () => {
      // Create a bare repo to clone from
      const bareDir = join(testDir, 'bare.git');
      await Bun.spawn(['git', 'init', '--bare', bareDir]).exited;

      const cloneDir = join(testDir, 'cloned');
      await gitService.clone(bareDir, cloneDir);

      // Verify the clone worked by checking if it's a git repo
      const clonedGitService = new GitService(cloneDir);
      const isRepo = await clonedGitService.isRepository();
      expect(isRepo).toBe(true);
    });

    it('should handle clone with destination directory', async () => {
      const bareDir = join(testDir, 'bare2.git');
      await Bun.spawn(['git', 'init', '--bare', bareDir]).exited;

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
      await Bun.spawn(['git', 'init'], { cwd: otherDir }).exited;

      const otherService = gitService.withCwd(otherDir);
      const result = await otherService.isRepository();

      expect(result).toBe(true);
    });

    it('should not affect original instance', async () => {
      const otherDir = join(testDir, 'other');
      await mkdir(otherDir, { recursive: true });
      await Bun.spawn(['git', 'init'], { cwd: otherDir }).exited;

      gitService.withCwd(otherDir);

      // Original should still be non-git directory
      const result = await gitService.isRepository();
      expect(result).toBe(false);
    });
  });
});
