import { describe, it, expect } from 'bun:test';
import { DeleteCommentPRCommand } from '../../../src/commands/pr/comments.delete.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockPromptService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('DeleteCommentPRCommand', () => {
  it('should delete a comment and show success message', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { prId: '42', commentId: '7', yes: true },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) => log.includes('Deleted comment #7 from PR #42'))
    ).toBe(true);
  });

  it('should return JSON on success', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { prId: '42', commentId: '7', yes: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.commentId).toBe(7);
  });

  it('should propagate API error on delete failure', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      throwOnCommentDelete: true,
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API Error');
  });

  it('should throw when no repo context available', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute(
        { prId: '42', commentId: '7', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow();
  });

  it('should throw without --yes flag', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteCommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    await expect(
      command.execute({ prId: '42', commentId: '7' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm');
  });

  it('asks for confirmation in an interactive terminal', async () => {
    const output = createMockOutputService();
    const prompt = createMockPromptService([true]);
    const command = new DeleteCommentPRCommand(
      createMockPullrequestsApi(),
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      output
    );

    await command.execute(
      { prId: '42', commentId: '7' },
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual([
      'confirm:This will permanently delete comment #7 on PR #42. Continue?',
    ]);
    expect(output.logs.some((log) => log.includes('Deleted comment #7'))).toBe(
      true
    );
  });
});
