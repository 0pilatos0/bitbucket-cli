import { describe, it, expect } from 'bun:test';
import { EditPRCommand } from '../../../src/commands/pr/edit.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
  mockPullRequest,
} from '../../setup.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('EditPRCommand', () => {
  it('should update PR title', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', title: 'New Title' },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastPutBody).toEqual({
      type: 'pullrequest',
      title: 'New Title',
    });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Updated'))).toBe(true);
  });

  it('should update PR body', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', body: 'New description' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should auto-detect PR from current branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Updated via auto-detect' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should auto-detect PR across paginated results', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequestPages: [
        [
          {
            ...mockPullRequest,
            id: 50,
            source: {
              branch: { name: 'other-branch' },
            },
          } as Pullrequest,
        ],
        [
          {
            ...mockPullRequest,
            id: 51,
            source: {
              branch: { name: 'feature-branch' },
            },
          } as Pullrequest,
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Updated via paginated auto-detect' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail when no changes provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ id: '1' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('At least one of'))).toBe(
      true
    );
  });

  it('should fail when PR not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when no repo context', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '1', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when auto-detect finds no matching PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'other-branch' });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(
      output.logs.some((log) => log.includes('No open pull request found'))
    ).toBe(true);
  });
});
