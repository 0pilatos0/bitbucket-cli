/**
 * Extended ContextService tests
 */

import { describe, it, expect } from 'bun:test';
import { ContextService } from '../../src/services/context.service.js';
import { ErrorCode } from '../../src/types/errors.js';
import type {
  IGitService,
  IConfigService,
} from '../../src/core/interfaces/services.js';
import type { BBError } from '../../src/types/errors.js';
import type { BBConfig, AuthCredentials } from '../../src/types/config.js';

function createMockGitService(options: {
  isRepo?: boolean;
  remoteUrl?: string;
  remoteError?: boolean;
}): IGitService {
  return {
    async isRepository() {
      return options.isRepo ?? false;
    },
    async clone() {
      // Mock implementation
    },
    async fetch() {
      // Mock implementation
    },
    async checkout() {
      // Mock implementation
    },
    async checkoutNewBranch() {
      // Mock implementation
    },
    async getCurrentBranch() {
      return 'main';
    },
    async getRemoteUrl() {
      if (options.remoteError) {
        throw {
          code: ErrorCode.GIT_REMOTE_NOT_FOUND,
          message: 'No remote',
        } as BBError;
      }
      if (options.remoteUrl) {
        return options.remoteUrl;
      }
      throw {
        code: ErrorCode.GIT_REMOTE_NOT_FOUND,
        message: 'No remote',
      } as BBError;
    },
  };
}

function createMockConfigService(config: BBConfig = {}): IConfigService {
  let currentConfig = { ...config };

  return {
    async getConfig() {
      return currentConfig;
    },
    async setConfig(newConfig: BBConfig) {
      currentConfig = newConfig;
    },
    async getCredentials(): Promise<AuthCredentials> {
      if (!currentConfig.username || !currentConfig.apiToken) {
        throw {
          code: ErrorCode.AUTH_REQUIRED,
          message: 'Auth required',
        } as BBError;
      }
      return {
        username: currentConfig.username,
        apiToken: currentConfig.apiToken,
      };
    },
    async setCredentials(creds: AuthCredentials) {
      currentConfig.username = creds.username;
      currentConfig.apiToken = creds.apiToken;
    },
    async clearCredentials() {
      const {
        username: _username,
        apiToken: _apiToken,
        ...rest
      } = currentConfig;
      currentConfig = rest;
    },
    async clearConfig() {
      currentConfig = {};
    },
    async getValue<K extends keyof BBConfig>(key: K) {
      return currentConfig[key];
    },
    async setValue<K extends keyof BBConfig>(key: K, value: BBConfig[K]) {
      currentConfig[key] = value;
    },
    getConfigPath() {
      return '/test/config.json';
    },
  };
}

describe('ContextService - Extended Tests', () => {
  describe('URL Parsing', () => {
    describe('SSH URLs', () => {
      it('should parse git@bitbucket.org:workspace/repo.git', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@bitbucket.org:workspace/repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'workspace',
          repoSlug: 'repo',
        });
      });

      it('should handle repo without .git extension', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@bitbucket.org:workspace/repo',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'workspace',
          repoSlug: 'repo',
        });
      });
    });

    describe('HTTPS URLs', () => {
      it('should parse https://bitbucket.org/workspace/repo.git', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'https://bitbucket.org/workspace/repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'workspace',
          repoSlug: 'repo',
        });
      });

      it('should parse https://username@bitbucket.org/workspace/repo.git', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'https://username@bitbucket.org/workspace/repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'workspace',
          repoSlug: 'repo',
        });
      });

      it('should handle repo without .git extension', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'https://bitbucket.org/workspace/repo',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'workspace',
          repoSlug: 'repo',
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle workspace with hyphens', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@bitbucket.org:my-workspace/my-repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'my-workspace',
          repoSlug: 'my-repo',
        });
      });

      it('should handle workspace with underscores', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@bitbucket.org:my_workspace/my_repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: 'my_workspace',
          repoSlug: 'my_repo',
        });
      });

      it('should handle numeric workspace/repo names', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@bitbucket.org:123/456.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        expect(result).toEqual({
          workspace: '123',
          repoSlug: '456',
        });
      });
    });

    describe('Non-Bitbucket URLs', () => {
      it('should return null for GitHub URLs (not parsed as Bitbucket)', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@github.com:user/repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        // Returns null value (not an error, just not parseable)
        expect(result).toBeNull();
      });

      it('should return null for GitLab URLs (not parsed as Bitbucket)', async () => {
        const gitService = createMockGitService({
          isRepo: true,
          remoteUrl: 'git@gitlab.com:user/repo.git',
        });
        const configService = createMockConfigService();
        const contextService = new ContextService(gitService, configService);

        const result = await contextService.getRepoContext({});

        // Returns null value (not an error, just not parseable)
        expect(result).toBeNull();
      });
    });
  });

  describe('getRepoContext', () => {
    it('should return null when not in git repository', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService();
      const contextService = new ContextService(gitService, configService);

      const result = await contextService.getRepoContext({});

      // Returns null (not in a git repo is not an error)
      expect(result).toBeNull();
    });

    it('should return null when no remote exists', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteError: true,
      });
      const configService = createMockConfigService();
      const contextService = new ContextService(gitService, configService);

      const result = await contextService.getRepoContext({});

      // Returns null (no remote is not an error)
      expect(result).toBeNull();
    });
  });

  describe('requireRepoContext', () => {
    it('should use provided options over git context', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:git-workspace/git-repo.git',
      });
      const configService = createMockConfigService();
      const contextService = new ContextService(gitService, configService);

      const result = await contextService.requireRepoContext({
        workspace: 'option-workspace',
        repo: 'option-repo',
      });

      expect(result.workspace).toBe('option-workspace');
      expect(result.repoSlug).toBe('option-repo');
    });

    it('should use partial options with git context', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:git-workspace/git-repo.git',
      });
      const configService = createMockConfigService();
      const contextService = new ContextService(gitService, configService);

      const result = await contextService.requireRepoContext({
        workspace: 'option-workspace',
        // repo not provided, should come from git
      });

      expect(result.workspace).toBe('option-workspace');
      expect(result.repoSlug).toBe('git-repo');
    });

    it('should fail when not in git repo and no context available', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService({
        // Config defaults don't directly provide context in current implementation
        defaultWorkspace: 'config-workspace',
      });
      const contextService = new ContextService(gitService, configService);

      // requireRepoContext throws when no context can be determined
      await expect(contextService.requireRepoContext({})).rejects.toMatchObject(
        {
          code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        }
      );
    });

    it('should fail when no context available', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService({});
      const contextService = new ContextService(gitService, configService);

      await expect(contextService.requireRepoContext({})).rejects.toMatchObject(
        {
          code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        }
      );
    });

    it('should fail when only workspace available', async () => {
      const gitService = createMockGitService({ isRepo: false });
      const configService = createMockConfigService({
        defaultWorkspace: 'workspace',
      });
      const contextService = new ContextService(gitService, configService);

      await expect(contextService.requireRepoContext({})).rejects.toBeDefined();
    });
  });

  describe('Priority Order', () => {
    it('should prioritize: options > git remote > config defaults', async () => {
      const gitService = createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:git-ws/git-repo.git',
      });
      const configService = createMockConfigService({
        defaultWorkspace: 'config-ws',
      });
      const contextService = new ContextService(gitService, configService);

      // Options take highest priority
      let result = await contextService.requireRepoContext({
        workspace: 'option-ws',
        repo: 'option-repo',
      });

      expect(result.workspace).toBe('option-ws');
      expect(result.repoSlug).toBe('option-repo');

      // Git remote takes priority over config
      result = await contextService.requireRepoContext({});

      expect(result.workspace).toBe('git-ws');
      expect(result.repoSlug).toBe('git-repo');
    });
  });
});
