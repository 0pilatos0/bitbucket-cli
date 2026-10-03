import { describe, it, expect } from 'bun:test';
import { CheckoutPRCommand } from '../../../src/commands/pr/checkout.command.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import {
  createMockConfigService,
  createMockContextService,
  createMockOutputService,
  createMockGitService,
  mockPullRequest,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('CheckoutPRCommand', () => {
  it('should checkout pull request branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ isRepo: true });
    const output = createMockOutputService();

    const command = new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      createMockConfigService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ isRepo: true });
    const output = createMockOutputService();

    const command = new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      createMockConfigService(),
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fetch a fork over the protocol of the repository remote', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        {
          ...mockPullRequest,
          source: {
            branch: { name: 'feature-branch' },
            repository: { full_name: 'alice/repo' },
          },
        } as unknown as Pullrequest,
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      isRepo: true,
      remoteUrl: 'https://bitbucket.org/workspace/repo.git',
    });
    const fetches: string[][] = [];
    gitService.fetch = async (remote: string, refspecs: string[] = []) => {
      fetches.push([remote, ...refspecs]);
    };

    const command = new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      createMockConfigService(),
      createMockOutputService()
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(fetches).toEqual([
      ['https://bitbucket.org/alice/repo.git', 'refs/heads/feature-branch'],
    ]);
  });
});
