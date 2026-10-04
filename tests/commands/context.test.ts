import { describe, it, expect, afterEach } from 'bun:test';
import { ContextCommand } from '../../src/commands/context.command.js';
import { ContextService } from '../../src/services/context.service.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';
import type { GlobalOptions } from '../../src/types/config.js';
import {
  createMockConfigService,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';

const REMOTE = 'git@bitbucket.org:git-ws/git-repo.git';
const originalWorkspaceEnv = process.env.BB_WORKSPACE;

afterEach(() => {
  if (originalWorkspaceEnv === undefined) {
    delete process.env.BB_WORKSPACE;
  } else {
    process.env.BB_WORKSPACE = originalWorkspaceEnv;
  }
});

function setup(
  git: Parameters<typeof createMockGitService>[0] = {},
  defaultWorkspace?: string
) {
  const gitService = createMockGitService(git);
  const contextService = new ContextService(
    gitService,
    createMockConfigService(defaultWorkspace ? { defaultWorkspace } : {})
  );
  const output = createMockOutputService();
  const command = new ContextCommand(contextService, gitService, output);
  return { command, contextService, output };
}

function context(globalOptions: GlobalOptions = {}): CommandContext {
  return { globalOptions };
}

describe('ContextService.inspectContext', () => {
  it('takes both values from the git remote', async () => {
    const { contextService } = setup({ isRepo: true, remoteUrl: REMOTE });

    expect(await contextService.inspectContext({})).toEqual({
      workspace: 'git-ws',
      repo: 'git-repo',
      source: { workspace: 'remote', repo: 'remote' },
      remote: REMOTE,
    });
  });

  it('lets flags win over the remote, each independently', async () => {
    const { contextService } = setup({ isRepo: true, remoteUrl: REMOTE });

    const result = await contextService.inspectContext({
      workspace: 'flag-ws',
    });

    expect(result.workspace).toBe('flag-ws');
    expect(result.repo).toBe('git-repo');
    expect(result.source).toEqual({ workspace: 'flag', repo: 'remote' });
  });

  it('falls back to BB_WORKSPACE, then defaultWorkspace, outside a repo', async () => {
    process.env.BB_WORKSPACE = 'env-ws';
    const withEnv = await setup({}, 'config-ws').contextService.inspectContext({
      repo: 'flag-repo',
    });
    expect(withEnv.workspace).toBe('env-ws');
    expect(withEnv.source).toEqual({ workspace: 'env', repo: 'flag' });

    delete process.env.BB_WORKSPACE;
    const withConfig = await setup(
      {},
      'config-ws'
    ).contextService.inspectContext({});
    expect(withConfig).toEqual({
      workspace: 'config-ws',
      repo: null,
      source: { workspace: 'config', repo: null },
      remote: null,
    });
  });

  it('reports a non-Bitbucket remote without resolving from it', async () => {
    delete process.env.BB_WORKSPACE;
    const remote = 'https://github.com/acme/tool.git';
    const { contextService } = setup({ isRepo: true, remoteUrl: remote });

    expect(await contextService.inspectContext({})).toEqual({
      workspace: null,
      repo: null,
      source: { workspace: null, repo: null },
      remote,
    });
  });

  it('masks the password in an HTTPS remote', async () => {
    const { contextService } = setup({
      isRepo: true,
      remoteUrl: 'https://user:s3cret@bitbucket.org/git-ws/git-repo.git',
    });

    const result = await contextService.inspectContext({});

    expect(result.remote).toBe(
      'https://user:***@bitbucket.org/git-ws/git-repo.git'
    );
    expect(result.repo).toBe('git-repo');
  });

  it('agrees with getRepoContext on what commands would use', async () => {
    process.env.BB_WORKSPACE = 'env-ws';
    const cases: GlobalOptions[] = [
      {},
      { workspace: 'w' },
      { repo: 'r' },
      { workspace: 'w', repo: 'r' },
    ];
    for (const git of [{}, { isRepo: true, remoteUrl: REMOTE }]) {
      for (const options of cases) {
        const { contextService } = setup(git);
        const inspected = await contextService.inspectContext(options);
        const resolved = await contextService.getRepoContext(options);
        expect(
          resolved && { workspace: resolved.workspace, repo: resolved.repoSlug }
        ).toEqual(
          inspected.workspace && inspected.repo
            ? { workspace: inspected.workspace, repo: inspected.repo }
            : null
        );
      }
    }
  });
});

describe('ContextCommand', () => {
  it('prints the resolved context with the branch as JSON', async () => {
    const { command, output } = setup({
      isRepo: true,
      remoteUrl: REMOTE,
      currentBranch: 'feat/login',
    });

    await command.run(undefined, context({ json: true }));

    expect(output.logs).toEqual([
      `json:${JSON.stringify({
        workspace: 'git-ws',
        repo: 'git-repo',
        source: { workspace: 'remote', repo: 'remote' },
        remote: REMOTE,
        branch: 'feat/login',
      })}`,
    ]);
  });

  it('labels each value with its source in text mode', async () => {
    const { command, output } = setup({
      isRepo: true,
      remoteUrl: REMOTE,
      currentBranch: 'main',
    });

    await command.run(undefined, context({ repo: 'other' }));

    expect(output.logs).toEqual([
      'text:Workspace:   git-ws (git remote)',
      'text:Repository:  other (flag)',
      `text:Remote:      ${REMOTE}`,
      'text:Branch:      main',
    ]);
  });

  it('reports nulls instead of failing outside a repository', async () => {
    delete process.env.BB_WORKSPACE;
    const { command, output } = setup({ throwOnGetCurrentBranch: true });

    const result = await command.run(undefined, context());

    expect(result.branch).toBeNull();
    expect(output.logs).toEqual([
      'text:Workspace:   not set',
      'text:Repository:  not set',
      'text:Remote:      none',
      'text:Branch:      none',
    ]);
  });

  it('reports a detached HEAD as no branch', async () => {
    const { command } = setup({
      isRepo: true,
      remoteUrl: REMOTE,
      currentBranch: 'HEAD',
    });

    const result = await command.run(undefined, context({ json: true }));

    expect(result.branch).toBeNull();
  });
});
