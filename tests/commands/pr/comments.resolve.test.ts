import { describe, it, expect } from 'bun:test';
import { ResolveCommentPRCommand } from '../../../src/commands/pr/comments.resolve.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { APIError, BBError, ErrorCode } from '../../../src/types/errors.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ResolveCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ResolveCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should resolve a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Resolved comment #7 on PR #42');
    expect(pullrequestsApi.lastResolveRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should send an empty body, which Bitbucket requires on this POST', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastResolveOptions).toEqual({
      data: {},
    });
  });

  it('should return JSON with the resolution payload', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
    expect(parsed.resolution.type).toBe('comment_resolution');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should throw when pr-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: 'abc', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('<pr-id> must be a positive integer.');
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    try {
      await command.execute(
        { prId: '42', commentId: '0' },
        { globalOptions: {} }
      );
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toContain(
        '<comment-id> must be a positive integer.'
      );
    }
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should propagate API errors without emitting a success line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentResolve: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });
  it('should wrap a 404 with a not-found message naming the location', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentResolveError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});
