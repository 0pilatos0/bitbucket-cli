import { describe, it, expect } from 'bun:test';
import { EditCommentPRCommand } from '../../../src/commands/pr/comments.edit.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('EditCommentPRCommand', () => {
  it('should edit a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Updated comment #7 on PR #42'))
    ).toBe(true);
  });

  // Bitbucket rejects `type` on the comment payload with 400 "extra keys not
  // allowed", so the update body must carry content only.
  it('should send only content, without type', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: {} }
    );

    const body = pullrequestsApi.lastCommentEditBody as
      Record<string, unknown> | undefined;
    expect(body).toEqual({ content: { raw: 'Updated text' } });
  });

  it('should return JSON on success', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { prId: '42', commentId: '7', message: 'Updated text' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
    expect(parsed.comment).toBeDefined();
  });

  it('should propagate API error on edit failure', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentEdit: true,
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Updated text' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
  });

  it('should throw when no repo context available', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new EditCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', message: 'Updated text' },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });
});
