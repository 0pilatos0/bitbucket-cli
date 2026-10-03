import { describe, it, expect } from 'bun:test';
import { CommentPRCommand } from '../../../src/commands/pr/comment.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { BBError, ErrorCode } from '../../../src/types/errors.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('CommentPRCommand', () => {
  describe('--body-file', () => {
    const markdown = 'Nit: prefer `const` here.\n\n```ts\nconst x = 1;\n```\n';

    class StdinCommentPRCommand extends CommentPRCommand {
      protected override async readStdin(): Promise<string> {
        return markdown;
      }
    }

    const buildCommand = () => {
      const pullrequestsApi = createMockPullrequestsApi();
      return {
        pullrequestsApi,
        command: new StdinCommentPRCommand(
          pullrequestsApi,
          createMockContextService({
            workspace: 'workspace',
            repoSlug: 'repo',
          }),
          createMockOutputService()
        ),
      };
    };

    it('posts the stdin text for -', async () => {
      const { command, pullrequestsApi } = buildCommand();
      await command.execute({ id: '42', bodyFile: '-' }, { globalOptions: {} });

      expect(pullrequestsApi.lastCommentBody?.content).toEqual({
        raw: markdown,
      });
    });

    it('rejects a message together with --body-file', async () => {
      const { command, pullrequestsApi } = buildCommand();
      const error = await command
        .execute(
          { id: '42', message: 'inline', bodyFile: '-' },
          { globalOptions: {} }
        )
        .catch((e: unknown) => e);

      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(pullrequestsApi.lastCommentBody).toBeUndefined();
    });

    it('requires a message or --body-file', async () => {
      const { command, pullrequestsApi } = buildCommand();
      const error = await command
        .execute({ id: '42' }, { globalOptions: {} })
        .catch((e: unknown) => e);

      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect(pullrequestsApi.lastCommentBody).toBeUndefined();
    });
  });

  // US4: Backward compatibility — general comments work unchanged
  it('should post general comment successfully without inline flags', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Looks good!' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Added comment to pull request'))
    ).toBe(true);
  });

  it('should output general comment JSON without inline key', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Looks good!' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.comment).toBeDefined();
    expect(parsed.inline).toBeUndefined();
  });

  // US3: Validation — invalid flag combinations
  it('should throw when --line-to is used without --file', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', lineTo: '15' },
        { globalOptions: {} }
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toContain(
        '--file is required when using --line-to or --line-from'
      );
      expect((error as BBError).message).toContain('Valid modes:');
    }
  });

  it('should throw when --line-from is used without --file', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', lineFrom: '10' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toContain(
        '--file is required when using --line-to or --line-from'
      );
      expect((error as BBError).message).toContain('Valid modes:');
    }
  });

  it('should throw when --file is used without --line-to or --line-from', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      expect((error as BBError).message).toContain(
        'At least one of --line-to or --line-from is required when using --file'
      );
      expect((error as BBError).message).toContain('Valid modes:');
    }
  });

  it('should throw when --line-to is non-numeric', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: 'abc' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toMatch(
        /^--line-to must be a positive integer\./
      );
    }
  });

  it('should throw when --line-to is zero', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '0' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toMatch(
        /^--line-to must be a positive integer\./
      );
    }
  });

  it('should throw when --line-from is negative', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { id: '42', message: 'Fix this', file: 'src/app.ts', lineFrom: '-1' },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
      expect((error as BBError).message).toMatch(
        /^--line-from must be a positive integer\./
      );
    }
  });

  // US1: Inline comment with --file and --line-to
  it('should post inline comment with --file and --line-to', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/app.ts', to: 15 });
  });

  it('should show inline success message with file and line', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes('Added inline comment on src/app.ts:15 to pull request')
      )
    ).toBe(true);
  });

  it('should output inline comment JSON with inline key', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Fix this', file: 'src/app.ts', lineTo: '15' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.success).toBe(true);
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.comment).toBeDefined();
    expect(parsed.inline).toEqual({ path: 'src/app.ts', to: 15 });
  });

  // US2: Inline comment with --line-from only
  it('should post inline comment with --file and --line-from only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Why removed?', file: 'src/old.ts', lineFrom: '10' },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/old.ts', from: 10 });
  });

  // US2: Inline comment with both --line-to and --line-from
  it('should post inline comment with --file, --line-to, and --line-from', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      {
        id: '42',
        message: 'This refactor looks good',
        file: 'src/app.ts',
        lineTo: '20',
        lineFrom: '15',
      },
      { globalOptions: {} }
    );

    const apiBody = (pullrequestsApi as any).lastCommentBody;
    expect(apiBody).toBeDefined();
    expect(apiBody.inline).toEqual({ path: 'src/app.ts', to: 20, from: 15 });
  });

  // US2: Success message for --line-from only
  it('should show old line in success message for --line-from only', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new CommentPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '42', message: 'Why removed?', file: 'src/old.ts', lineFrom: '10' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.includes(
          'Added inline comment on src/old.ts (old line 10) to pull request'
        )
      )
    ).toBe(true);
  });
});
