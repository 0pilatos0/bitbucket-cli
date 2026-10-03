import { describe, it, expect } from 'bun:test';
import { RemoveReviewerPRCommand } from '../../../src/commands/pr/reviewers.remove.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import {
  createMockPullrequestsApi,
  createMockUsersApi,
  createUserResolverStub,
} from './fakes.js';

describe('RemoveReviewerPRCommand', () => {
  it('should remove reviewer from list and show success', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{remove-uuid}', display_name: 'Remove Me' },
        { uuid: '{keep-uuid}', display_name: 'Keep Me' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{remove-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      createUserResolverStub(usersApi),
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'removeuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed Test User as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should remove last reviewer leaving empty list', async () => {
    const prWithOneReviewer: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{only-uuid}', display_name: 'Only Reviewer' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithOneReviewer],
    });
    const usersApi = createMockUsersApi({ uuid: '{only-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      createUserResolverStub(usersApi),
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'onlyuser' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed Test User as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should succeed silently when removing non-existent reviewer', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{other-uuid}', display_name: 'Other' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{not-in-list}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      createUserResolverStub(usersApi),
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'ghost' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Removed Test User as reviewer from pull request #42')
      )
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { uuid: '{remove-uuid}', display_name: 'Remove Me' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const usersApi = createMockUsersApi({ uuid: '{remove-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      createUserResolverStub(usersApi),
      contextService,
      output
    );
    await command.execute(
      { id: '42', username: 'removeuser' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.reviewer.username).toBe('removeuser');
    expect(parsed.reviewer.uuid).toBe('{remove-uuid}');
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

    const command = new RemoveReviewerPRCommand(
      pullrequestsApi,
      createUserResolverStub(usersApi),
      contextService,
      output
    );

    await expect(
      command.execute({ id: '42', username: 'unknown' }, { globalOptions: {} })
    ).rejects.toThrow('User not found');
  });
});
