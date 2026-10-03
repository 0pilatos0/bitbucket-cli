import { describe, it, expect } from 'bun:test';
import { CheckoutPRCommand } from '../../../src/commands/pr/checkout.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
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
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});
