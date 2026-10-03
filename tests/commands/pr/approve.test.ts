import { describe, it, expect } from 'bun:test';
import { ApprovePRCommand } from '../../../src/commands/pr/approve.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ApprovePRCommand', () => {
  it('should approve pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ApprovePRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Approved'))).toBe(true);
  });
});
