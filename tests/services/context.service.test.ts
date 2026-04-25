/**
 * Context service tests
 */

import { describe, it, expect } from 'bun:test';
import { ContextService } from '../../src/services/context.service.js';
import { createMockGitService, createMockConfigService } from '../setup.js';
import { ErrorCode } from '../../src/types/errors.js';

describe('ContextService', () => {
  describe('parseRemoteUrl', () => {
    it('should parse SSH URL', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = service.parseRemoteUrl(
        'git@bitbucket.org:myworkspace/myrepo.git'
      );

      expect(result).toEqual({
        workspace: 'myworkspace',
        repoSlug: 'myrepo',
      });
    });

    it('should parse SSH URL without .git suffix', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = service.parseRemoteUrl('git@bitbucket.org:workspace/repo');

      expect(result).toEqual({
        workspace: 'workspace',
        repoSlug: 'repo',
      });
    });

    it('should parse HTTPS URL', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = service.parseRemoteUrl(
        'https://bitbucket.org/myworkspace/myrepo.git'
      );

      expect(result).toEqual({
        workspace: 'myworkspace',
        repoSlug: 'myrepo',
      });
    });

    it('should parse HTTPS URL with username', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = service.parseRemoteUrl(
        'https://user@bitbucket.org/workspace/repo.git'
      );

      expect(result).toEqual({
        workspace: 'workspace',
        repoSlug: 'repo',
      });
    });

    it('should return null for GitHub URLs', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = service.parseRemoteUrl('git@github.com:user/repo.git');

      expect(result).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      expect(service.parseRemoteUrl('not-a-url')).toBeNull();
      expect(service.parseRemoteUrl('')).toBeNull();
    });

    it('should reject SSH URLs with attacker-controlled trailing path', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      expect(
        service.parseRemoteUrl('git@bitbucket.org:foo/bar.git.attacker.com/x/y')
      ).toBeNull();
    });

    it('should reject HTTPS URLs with attacker-controlled trailing path', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      expect(
        service.parseRemoteUrl(
          'https://bitbucket.org/foo/bar.git.attacker.com/x/y'
        )
      ).toBeNull();
    });

    it('should reject URLs with crafted prefixes', () => {
      const gitService = createMockGitService();
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      expect(
        service.parseRemoteUrl('prefix git@bitbucket.org:foo/bar.git')
      ).toBeNull();
      expect(
        service.parseRemoteUrl('xhttps://bitbucket.org/foo/bar.git')
      ).toBeNull();
    });
  });

  describe('getRepoContextFromGit', () => {
    it('should return null when not in a git repo', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContextFromGit();

      expect(result).toBeNull();
    });

    it('should return context from git remote', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:myworkspace/myrepo.git',
      });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContextFromGit();

      expect(result).toEqual({
        workspace: 'myworkspace',
        repoSlug: 'myrepo',
      });
    });

    it('should return null when remote URL is not Bitbucket', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@github.com:user/repo.git',
      });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContextFromGit();

      expect(result).toBeNull();
    });
  });

  describe('getRepoContext', () => {
    it('should prefer explicit options over git context', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:git-workspace/git-repo.git',
      });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContext({
        workspace: 'explicit-workspace',
        repo: 'explicit-repo',
      });

      expect(result).toEqual({
        workspace: 'explicit-workspace',
        repoSlug: 'explicit-repo',
      });
    });

    it('should use git context when no options provided', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:myworkspace/myrepo.git',
      });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContext({});

      expect(result).toEqual({
        workspace: 'myworkspace',
        repoSlug: 'myrepo',
      });
    });

    it('should use default workspace from config', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService({
        defaultWorkspace: 'config-workspace',
      });
      const service = new ContextService(gitService, configService);

      const result = await service.getRepoContext({ repo: 'my-repo' });

      expect(result).toEqual({
        workspace: 'config-workspace',
        repoSlug: 'my-repo',
      });
    });
  });

  describe('requireRepoContext', () => {
    it('should return context when available', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:workspace/repo.git',
      });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.requireRepoContext({});

      expect(result.workspace).toBe('workspace');
      expect(result.repoSlug).toBe('repo');
    });

    it('should throw error when context not available', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      await expect(service.requireRepoContext({})).rejects.toMatchObject({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
      });
    });
  });

  describe('requireRepoContextFor', () => {
    it('merges context.globalOptions with command options before resolving', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.requireRepoContextFor(
        {},
        { globalOptions: { workspace: 'gws', repo: 'grepo' } }
      );

      expect(result).toEqual({ workspace: 'gws', repoSlug: 'grepo' });
    });

    it('lets command-local options override globals', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      const result = await service.requireRepoContextFor(
        { workspace: 'local-ws', repo: 'local-repo' },
        { globalOptions: { workspace: 'gws', repo: 'grepo' } }
      );

      expect(result).toEqual({
        workspace: 'local-ws',
        repoSlug: 'local-repo',
      });
    });

    it('throws CONTEXT_REPO_NOT_FOUND when nothing resolves', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const service = new ContextService(gitService, configService);

      await expect(
        service.requireRepoContextFor({}, { globalOptions: {} })
      ).rejects.toMatchObject({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
      });
    });
  });

  describe('requireWorkspace', () => {
    it('returns the explicit value when provided', async () => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService({ defaultWorkspace: 'fallback' })
      );
      const result = await service.requireWorkspace('explicit');
      expect(result).toBe('explicit');
    });

    it('falls back to config.defaultWorkspace when explicit is omitted', async () => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService({ defaultWorkspace: 'fallback' })
      );
      const result = await service.requireWorkspace();
      expect(result).toBe('fallback');
    });

    it('ignores an empty explicit value and falls back', async () => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService({ defaultWorkspace: 'cfg' })
      );
      const result = await service.requireWorkspace('');
      expect(result).toBe('cfg');
    });

    it('throws CONTEXT_WORKSPACE_NOT_FOUND when neither is set', async () => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService({})
      );
      await expect(service.requireWorkspace()).rejects.toMatchObject({
        code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
      });
    });
  });
});
