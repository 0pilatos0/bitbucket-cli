import { describe, it, expect } from 'bun:test';
import { AddReviewerPRCommand } from '../../../src/commands/pr/reviewers.add.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import { createMockPullrequestsApi, createMockUsersApi } from './fakes.js';

describe('AddReviewerPRCommand', () => {
  it('should add reviewer to empty list and show success', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added newuser as reviewer to pull request #42')
      )
    ).toBe(true);
  });

  it('should add reviewer to existing list', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{existing-uuid}', display_name: 'Existing' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added newuser as reviewer to pull request #42')
      )
    ).toBe(true);
  });

  it('should not duplicate when adding existing reviewer', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{same-uuid}', display_name: 'Same User' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{same-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'sameuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Added sameuser as reviewer'))
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{new-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'newuser' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.reviewer.username).toBe('newuser');
    expect(parsed.reviewer.uuid).toBe('{new-uuid}');
    expect(parsed.pullRequest).toBeDefined();
  });

  it('should propagate error when user not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const usersApi = createMockUsersApi({ throwOnGetUser: true });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    await expect(
      command.execute({ id: '42', username: 'unknown' }, { globalOptions: {} })
    ).rejects.toThrow('User not found');
  });
});
