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

  describe('remote URL shapes', () => {
    const ws = { workspace: 'ws', repoSlug: 'repo' };
    const dotted = { workspace: 'ws', repoSlug: 'my.repo' };

    it.each([
      ['git@bitbucket.org:ws/repo.git', ws],
      ['git@bitbucket.org:ws/my.repo.git', dotted],
      ['git@bitbucket.org:ws/my.repo', dotted],
      ['bitbucket.org:ws/repo.git', ws],
      ['ssh://git@bitbucket.org/ws/repo.git', ws],
      ['ssh://git@bitbucket.org/ws/repo', ws],
      ['ssh://git@altssh.bitbucket.org:443/ws/repo.git', ws],
      ['git+ssh://git@bitbucket.org/ws/repo.git', ws],
      ['https://bitbucket.org/ws/repo/', ws],
      ['https://bitbucket.org/ws/repo.git/', ws],
      ['https://bitbucket.org/ws/my.repo.git', dotted],
      ['https://user@bitbucket.org/ws/repo.git', ws],
      ['https://user:secret@bitbucket.org/ws/repo.git', ws],
      ['https://BitBucket.org/ws/repo', ws],
      ['http://bitbucket.org/ws/repo', ws],
      [
        'https://bitbucket.org/{ws-uuid}/{repo-uuid}',
        { workspace: '{ws-uuid}', repoSlug: '{repo-uuid}' },
      ],
    ])('parses %s', (url, expected) => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService()
      );

      expect(service.parseRemoteUrl(url)).toEqual(expected);
    });

    it.each([
      'git@github.com:ws/repo.git',
      'https://bitbucket.org.attacker.com/ws/repo.git',
      'https://bitbucket.org/ws',
      'https://bitbucket.org/ws/repo/src/main',
      'git@bitbucket.org:/ws/repo.git',
      'git@bitbucket.org:ws/..',
      'git@bitbucket.org:ws/...',
      'file:///srv/bitbucket.org/ws/repo.git',
      '/srv/git/ws/repo.git',
    ])('rejects %s', (url) => {
      const service = new ContextService(
        createMockGitService(),
        createMockConfigService()
      );

      expect(service.parseRemoteUrl(url)).toBeNull();
    });

    it('does not resolve SSH host aliases without git', () => {
      const service = new ContextService(
        createMockGitService({
          sshHostnames: { 'bitbucket-work': 'bitbucket.org' },
        }),
        createMockConfigService()
      );

      expect(service.parseRemoteUrl('git@bitbucket-work:ws/repo.git')).toBe(
        null
      );
    });
  });

  describe('SSH host aliases', () => {
    it.each([
      'git@bitbucket-work:ws/repo.git',
      'ssh://git@bitbucket-work/ws/repo.git',
    ])('resolves %s through ssh config', async (url) => {
      const service = new ContextService(
        createMockGitService({
          isRepo: true,
          remoteUrl: url,
          sshHostnames: { 'bitbucket-work': 'bitbucket.org' },
        }),
        createMockConfigService()
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'ws',
        repoSlug: 'repo',
      });
    });

    it('ignores aliases that resolve to another host', async () => {
      const service = new ContextService(
        createMockGitService({
          isRepo: true,
          remoteUrl: 'git@work:ws/repo.git',
          sshHostnames: { work: 'github.com' },
        }),
        createMockConfigService()
      );

      expect(await service.getRepoContextFromGit()).toBeNull();
    });

    it('treats a one-letter scp host as a Windows drive', async () => {
      const service = new ContextService(
        createMockGitService({
          isRepo: true,
          remoteUrl: 'C:ws/repo',
          sshHostnames: { c: 'bitbucket.org' },
        }),
        createMockConfigService()
      );

      expect(await service.getRepoContextFromGit()).toBeNull();
    });

    it('never treats HTTPS hosts as SSH aliases', async () => {
      const service = new ContextService(
        createMockGitService({
          isRepo: true,
          remoteUrl: 'https://bitbucket-work/ws/repo.git',
          sshHostnames: { 'bitbucket-work': 'bitbucket.org' },
        }),
        createMockConfigService()
      );

      expect(await service.getRepoContextFromGit()).toBeNull();
    });
  });

  describe('remote selection', () => {
    const remotes = (...entries: Array<[string, string]>) =>
      entries.map(([name, url]) => ({ name, url }));

    const resolve = (gitRemotes: ReturnType<typeof remotes>) =>
      new ContextService(
        createMockGitService({ isRepo: true, remotes: gitRemotes }),
        createMockConfigService()
      );

    it('prefers origin over other Bitbucket remotes', async () => {
      const service = resolve(
        remotes(
          ['upstream', 'git@bitbucket.org:parent/repo.git'],
          ['origin', 'git@bitbucket.org:fork/repo.git']
        )
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'fork',
        repoSlug: 'repo',
      });
    });

    it('uses the only Bitbucket remote when origin is elsewhere', async () => {
      const service = resolve(
        remotes(
          ['origin', 'git@github.com:mirror/repo.git'],
          ['bb', 'git@bitbucket.org:ws/repo.git']
        )
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'ws',
        repoSlug: 'repo',
      });
    });

    it('uses a Bitbucket remote when there is no origin', async () => {
      const service = resolve(
        remotes(['bitbucket', 'https://bitbucket.org/ws/repo.git'])
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'ws',
        repoSlug: 'repo',
      });
    });

    it('treats remotes pointing at the same repository as one', async () => {
      const service = resolve(
        remotes(
          ['ssh', 'git@bitbucket.org:ws/repo.git'],
          ['https', 'https://bitbucket.org/WS/Repo.git']
        )
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'ws',
        repoSlug: 'repo',
      });
    });

    it('prefers upstream when Bitbucket remotes disagree', async () => {
      const service = resolve(
        remotes(
          ['origin', 'git@github.com:me/repo.git'],
          ['fork', 'git@bitbucket.org:me/repo.git'],
          ['upstream', 'git@bitbucket.org:parent/repo.git']
        )
      );

      expect(await service.getRepoContextFromGit()).toEqual({
        workspace: 'parent',
        repoSlug: 'repo',
      });
    });

    it('fails with ambiguous_remote and lists remote names only', async () => {
      const service = resolve(
        remotes(
          ['one', 'https://user:secret@bitbucket.org/a/repo.git'],
          ['two', 'git@bitbucket.org:b/repo.git']
        )
      );

      const error = await service.requireRepoContext({}).catch((e) => e);
      expect(error).toMatchObject({
        code: ErrorCode.CONTEXT_REPO_NOT_FOUND,
        message:
          'Git remotes one, two point to different Bitbucket repositories and neither origin nor upstream is one of them. Use --workspace and --repo options to pick one.',
        context: { reason: 'ambiguous_remote', remotes: ['one', 'two'] },
      });
      expect(JSON.stringify(error)).not.toContain('secret');
    });

    it('names every remote when none is Bitbucket', async () => {
      const service = resolve(
        remotes(
          ['origin', 'git@github.com:me/repo.git'],
          ['gitlab', 'git@gitlab.com:me/repo.git']
        )
      );

      await expect(service.requireRepoContext({})).rejects.toMatchObject({
        message:
          'None of the git remotes (origin, gitlab) is a Bitbucket URL. Use --workspace and --repo options, or run this command from within a Bitbucket repository.',
        context: {
          reason: 'remote_not_bitbucket',
          remotes: ['origin', 'gitlab'],
        },
      });
    });

    it('keeps the URL in the message for a single non-Bitbucket remote', async () => {
      const service = resolve(
        remotes(['origin', 'git@github.com:me/repo.git'])
      );

      await expect(service.requireRepoContext({})).rejects.toMatchObject({
        message:
          "Remote 'git@github.com:me/repo.git' is not a Bitbucket URL. Use --workspace and --repo options, or run this command from within a Bitbucket repository.",
        context: {
          reason: 'remote_not_bitbucket',
          remoteUrl: 'git@github.com:me/repo.git',
        },
      });
    });

    it('does not fall back when origin is Bitbucket with an unusable path', async () => {
      const service = resolve(
        remotes(
          ['origin', 'git@bitbucket.org:just-workspace'],
          ['backup', 'git@bitbucket.org:other/repo.git']
        )
      );

      await expect(service.requireRepoContext({})).rejects.toMatchObject({
        context: {
          reason: 'remote_not_bitbucket',
          remoteUrl: 'git@bitbucket.org:just-workspace',
        },
      });
    });

    it('masks the password of a reported remote URL', async () => {
      const service = resolve(
        remotes(['origin', 'https://me:s3cret@github.com/me/repo.git'])
      );

      const error = await service.requireRepoContext({}).catch((e) => e);
      expect(error.context.remoteUrl).toBe(
        'https://me:***@github.com/me/repo.git'
      );
      expect(JSON.stringify(error)).not.toContain('s3cret');
      expect(error.message).not.toContain('s3cret');
    });

    it('reports no_remote when the repository has none', async () => {
      const service = resolve([]);

      await expect(service.requireRepoContext({})).rejects.toMatchObject({
        context: { reason: 'no_remote' },
      });
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

  describe('resolveWorkspaceFor', () => {
    const remote = () =>
      createMockGitService({
        isRepo: true,
        remoteUrl: 'git@bitbucket.org:git-ws/repo.git',
      });

    it('prefers the command-local workspace, then the global flag', async () => {
      const service = new ContextService(remote(), createMockConfigService());

      expect(
        await service.resolveWorkspaceFor(
          { workspace: 'local-ws' },
          { globalOptions: { workspace: 'gws' } }
        )
      ).toBe('local-ws');
      expect(
        await service.resolveWorkspaceFor(
          {},
          { globalOptions: { workspace: 'gws' } }
        )
      ).toBe('gws');
    });

    it('uses the git remote workspace before the configured default', async () => {
      const service = new ContextService(
        remote(),
        createMockConfigService({ defaultWorkspace: 'cfg' })
      );

      expect(await service.resolveWorkspaceFor({}, { globalOptions: {} })).toBe(
        'git-ws'
      );
    });

    it('falls back to the configured default outside a Bitbucket repo', async () => {
      const service = new ContextService(
        createMockGitService({ isRepo: false }),
        createMockConfigService({ defaultWorkspace: 'cfg' })
      );

      expect(await service.resolveWorkspaceFor({}, { globalOptions: {} })).toBe(
        'cfg'
      );
    });

    it('throws CONTEXT_WORKSPACE_NOT_FOUND when nothing resolves', async () => {
      const service = new ContextService(
        createMockGitService({ isRepo: false }),
        createMockConfigService({})
      );

      await expect(
        service.resolveWorkspaceFor({}, { globalOptions: {} })
      ).rejects.toMatchObject({ code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND });
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

  describe('BB_WORKSPACE env var', () => {
    const originalEnv = process.env.BB_WORKSPACE;

    const restoreEnv = () => {
      if (originalEnv === undefined) {
        delete process.env.BB_WORKSPACE;
      } else {
        process.env.BB_WORKSPACE = originalEnv;
      }
    };

    it('is used by requireWorkspace when no explicit value or config default', async () => {
      process.env.BB_WORKSPACE = 'env-workspace';
      try {
        const service = new ContextService(
          createMockGitService(),
          createMockConfigService({})
        );
        expect(await service.requireWorkspace()).toBe('env-workspace');
      } finally {
        restoreEnv();
      }
    });

    it('wins over config.defaultWorkspace in requireWorkspace', async () => {
      process.env.BB_WORKSPACE = 'env-workspace';
      try {
        const service = new ContextService(
          createMockGitService(),
          createMockConfigService({ defaultWorkspace: 'config-workspace' })
        );
        expect(await service.requireWorkspace()).toBe('env-workspace');
      } finally {
        restoreEnv();
      }
    });

    it('loses to explicit value in requireWorkspace', async () => {
      process.env.BB_WORKSPACE = 'env-workspace';
      try {
        const service = new ContextService(
          createMockGitService(),
          createMockConfigService({})
        );
        expect(await service.requireWorkspace('explicit')).toBe('explicit');
      } finally {
        restoreEnv();
      }
    });

    it('is ignored when blank or whitespace', async () => {
      process.env.BB_WORKSPACE = '   ';
      try {
        const service = new ContextService(
          createMockGitService(),
          createMockConfigService({ defaultWorkspace: 'config-workspace' })
        );
        expect(await service.requireWorkspace()).toBe('config-workspace');
      } finally {
        restoreEnv();
      }
    });

    it('feeds into getRepoContext when only --repo is given and there is no git context', async () => {
      process.env.BB_WORKSPACE = 'env-workspace';
      try {
        const service = new ContextService(
          createMockGitService({ isRepo: false }),
          createMockConfigService({})
        );
        const result = await service.getRepoContext({ repo: 'my-repo' });
        expect(result).toEqual({
          workspace: 'env-workspace',
          repoSlug: 'my-repo',
        });
      } finally {
        restoreEnv();
      }
    });

    it('does not override git-detected workspace in getRepoContext', async () => {
      process.env.BB_WORKSPACE = 'env-workspace';
      try {
        const service = new ContextService(
          createMockGitService({
            isRepo: true,
            remoteUrl: 'git@bitbucket.org:git-workspace/git-repo.git',
          }),
          createMockConfigService({})
        );
        const result = await service.getRepoContext({});
        expect(result).toEqual({
          workspace: 'git-workspace',
          repoSlug: 'git-repo',
        });
      } finally {
        restoreEnv();
      }
    });
  });
});
