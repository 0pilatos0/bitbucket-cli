import { describe, it, expect } from 'bun:test';
import { ReadyPRCommand } from '../../../src/commands/pr/ready.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ReadyPRCommand', () => {
  it('should mark pull request as ready', async () => {
    const prs = [{ ...mockPullRequest, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ReadyPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(pullrequestsApi.lastPutBody).toEqual({
      type: 'pullrequest',
      draft: false,
    });
    expect(output.logs.some((log) => log.includes('ready for review'))).toBe(
      true
    );
  });
});
