import { describe, it, expect } from 'bun:test';
import { DeclinePRCommand } from '../../../src/commands/pr/decline.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('DeclinePRCommand', () => {
  it('should decline pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeclinePRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Declined'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeclinePRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });
});
