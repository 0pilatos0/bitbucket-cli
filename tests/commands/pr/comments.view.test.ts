import { describe, it, expect } from 'bun:test';
import { ViewCommentPRCommand } from '../../../src/commands/pr/comments.view.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockUser,
} from '../../setup.js';
import { APIError } from '../../../src/types/errors.js';
import type { PullrequestComment } from '../../../src/generated/api.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ViewCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ViewCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should render a detail block for the comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('#7');
    expect(text).toContain('Test User');
    expect(text).toContain('Looks good to me');
    expect(text).toContain('unresolved');
    expect(pullrequestsApi.lastCommentGetRequest).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pullRequestId: 42,
      commentId: 7,
    });
  });

  it('should report a resolved thread when resolution is present', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'Nit: rename this' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        resolution: {
          type: 'comment_resolution',
          user: mockUser,
          created_on: '2024-01-03T00:00:00.000Z',
        },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[resolved]');
    expect(text).not.toContain('[unresolved]');
  });

  it('should render [deleted] for a deleted comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'gone' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        deleted: true,
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[deleted]');
    expect(text).not.toContain('gone');
  });

  it('should output the raw comment object as JSON', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.id).toBe(7);
    expect(parsed.type).toBe('pullrequest_comment');
    expect(parsed.content.raw).toBe('Looks good to me');
    expect(output.logs.filter((log) => log.startsWith('text:'))).toHaveLength(
      0
    );
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute({ prId: '42', commentId: '0' }, { globalOptions: {} })
    ).rejects.toThrow('--comment-id must be a positive integer.');
  });

  it('should wrap a 404 with a not-found message naming the comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentGetError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });

  it('should propagate non-404 API errors', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentGet: true,
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('API Error');
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
  it('should render [pending] for an unpublished draft comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'draft note' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        pending: true,
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[pending]');
    expect(text).not.toContain('[unresolved]');
  });

  it('should render [no content] when the comment body is empty', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('[no content]');
  });

  it('should show the parent id when the comment is a reply', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'agreed' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        parent: { id: 5, type: 'pullrequest_comment' },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('Reply to: #5');
  });

  it('should omit the reply line for a top-level comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).not.toContain('Reply to:');
  });

  it('should show the file and line for an inline comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'off by one' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        inline: { path: 'src/index.ts', to: 42 },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('src/index.ts:42');
  });

  it('should fall back to the from line when a comment sits on a removed line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'why was this dropped?' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        inline: { path: 'src/old.ts', from: 17 },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('src/old.ts:17');
  });

  it('should show a file-level inline comment without a line number', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'this whole file needs a rewrite' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        inline: { path: 'src/legacy.ts' },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('src/legacy.ts');
    expect(text).not.toContain('src/legacy.ts:');
  });

  it('should name who resolved the thread', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'Nit: rename this' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        resolution: {
          type: 'comment_resolution',
          user: mockUser,
          created_on: '2024-01-03T00:00:00.000Z',
        },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    expect(output.logs.join('\n')).toContain('Resolved by: Test User');
  });

  it('should still mark the thread resolved when the resolver is unknown', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comment: {
        id: 7,
        type: 'pullrequest_comment',
        content: { raw: 'Nit: rename this' },
        user: mockUser,
        created_on: '2024-01-02T00:00:00.000Z',
        resolution: {
          type: 'comment_resolution',
          created_on: '2024-01-03T00:00:00.000Z',
        },
      } as PullrequestComment,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {} }
    );

    const text = output.logs.join('\n');
    expect(text).toContain('[resolved]');
    expect(text).not.toContain('Resolved by:');
  });
});
