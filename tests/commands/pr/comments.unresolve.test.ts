import { describe, it, expect } from 'bun:test';
import { UnresolveCommentPRCommand } from '../../../src/commands/pr/comments.unresolve.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { APIError } from '../../../src/types/errors.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('UnresolveCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new UnresolveCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should unresolve a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Unresolved comment #7 on PR #42');
    expect(pullrequestsApi.lastUnresolveRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should return JSON with identifiers only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    expect(JSON.parse(jsonLog!.substring(5))).toEqual({
      success: true,
      pullRequestId: 42,
      commentId: 7,
    });
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

    await expect(
      command.execute({ prId: '42', commentId: '0' }, { globalOptions: {} })
    ).rejects.toThrow('<comment-id> must be a positive integer.');
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
      throwOnCommentUnresolve: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });
  it('should wrap a 404 with a not-found message naming the location', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentUnresolveError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});
