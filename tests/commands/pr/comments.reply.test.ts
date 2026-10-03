import { describe, it, expect } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReplyCommentPRCommand } from '../../../src/commands/pr/comments.reply.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { APIError, BBError, ErrorCode } from '../../../src/types/errors.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ReplyCommentPRCommand', () => {
  const makeCommand = (
    api: ReturnType<typeof createMockPullrequestsApi>,
    contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    })
  ) => {
    const output = createMockOutputService();
    return {
      command: new ReplyCommentPRCommand(api, contextService, output),
      output,
    };
  };

  it('should post the file content for --body-file <path>', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-pr-reply-'));
    const path = join(dir, 'reply.md');
    writeFileSync(path, 'Done.\n\n- [x] `retry` capped\n');
    try {
      const pullrequestsApi = createMockPullrequestsApi();
      const { command } = makeCommand(pullrequestsApi);

      await command.execute(
        { prId: '42', commentId: '7', bodyFile: path },
        { globalOptions: {} }
      );

      expect(pullrequestsApi.lastCommentBody?.content).toEqual({
        raw: 'Done.\n\n- [x] `retry` capped\n',
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should reject a message together with --body-file', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    const error = await command
      .execute(
        { prId: '42', commentId: '7', message: 'inline', bodyFile: 'x.md' },
        { globalOptions: {} }
      )
      .catch((e: unknown) => e);

    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(pullrequestsApi.lastCommentBody).toBeUndefined();
  });

  it('should post a reply carrying the parent id and show success', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('success:Replied to comment #7 on PR #42');
    const body = pullrequestsApi.lastCommentBody as
      Record<string, unknown> | undefined;
    expect(body?.parent).toEqual({ id: 7 });
    expect(body?.content).toEqual({ raw: 'Agreed' });
  });

  // Bitbucket rejects `type` on the comment payload and on `parent` with
  // 400 "extra keys not allowed", so the body must carry neither.
  it('should omit type from the payload and from parent', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    const body = pullrequestsApi.lastCommentBody as
      Record<string, unknown> | undefined;
    expect(body).not.toHaveProperty('type');
    expect(Object.keys(body ?? {}).sort()).toEqual(['content', 'parent']);
    expect(body?.parent).not.toHaveProperty('type');
  });

  it('should address the reply to the resolved workspace, repo and PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: {} }
    );

    const request = pullrequestsApi.lastCommentRequest as
      Record<string, unknown> | undefined;
    expect(request?.workspace).toBe('workspace');
    expect(request?.repoSlug).toBe('repo');
    expect(request?.pullRequestId).toBe(42);
  });

  it('should return JSON with the created comment', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const { command, output } = makeCommand(pullrequestsApi);

    await command.execute(
      { prId: '42', commentId: '7', message: 'Agreed' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.parentId).toBe(7);
    expect(parsed.comment.id).toBe(201);
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should throw when pr-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute(
        { prId: 'abc', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--pr-id must be a positive integer.');
  });

  it('should throw when comment-id is not a positive integer', async () => {
    const { command } = makeCommand(createMockPullrequestsApi());

    await expect(
      command.execute(
        { prId: '42', commentId: '0', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--comment-id must be a positive integer.');
  });

  it('should throw when no repo context available', async () => {
    const { command } = makeCommand(
      createMockPullrequestsApi(),
      createMockContextService()
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });

  it('should propagate API errors without emitting a success line', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnComment: true,
    });
    const { command, output } = makeCommand(pullrequestsApi);

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
    expect(output.logs.some((log) => log.startsWith('success:'))).toBe(false);
  });

  it('should wrap a 404 with a not-found message naming the parent', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      commentPostError: new APIError('Not Found', 404),
    });
    const { command } = makeCommand(pullrequestsApi);

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Agreed' },
        { globalOptions: {} }
      )
    ).rejects.toThrow(
      'Comment #7 not found on pull request #42 in workspace/repo.'
    );
  });
});
