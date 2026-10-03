import { describe, it, expect, mock } from 'bun:test';
import { DiffPRCommand } from '../../../src/commands/pr/diff.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
  mockPullRequest,
} from '../../setup.js';
import { BBError, ErrorCode } from '../../../src/types/errors.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('DiffPRCommand', () => {
  it('should display full diff by ID', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  describe('--color validation', () => {
    const makeCommand = () => {
      const output = createMockOutputService();
      return new DiffPRCommand(
        createMockPullrequestsApi(),
        createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
        createMockGitService(),
        output
      );
    };

    it('rejects an invalid value instead of silently disabling color', async () => {
      // Previously `--color alwyas` fell through to "not always", quietly
      // dropping color and exiting 0.
      await expect(
        makeCommand().execute(
          { id: '1', color: 'alwyas' as 'always' },
          { globalOptions: {} }
        )
      ).rejects.toThrow('--color must be one of: auto, always, never');
    });

    it('suggests the intended value', async () => {
      await expect(
        makeCommand().execute(
          { id: '1', color: 'alwyas' as 'always' },
          { globalOptions: {} }
        )
      ).rejects.toThrow('(Did you mean always?)');
    });

    it('accepts each valid value', async () => {
      for (const when of ['auto', 'always', 'never'] as const) {
        await makeCommand().execute(
          { id: '1', color: when },
          { globalOptions: {} }
        );
      }
    });

    it('still allows the option to be omitted', async () => {
      await makeCommand().execute({ id: '1' }, { globalOptions: {} });
    });
  });

  it('should display diff for current branch when no ID provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  it('should auto-detect PR across paginated results', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequestPages: [
        [
          {
            ...mockPullRequest,
            id: 100,
            source: {
              branch: { name: 'other-branch' },
            },
          } as Pullrequest,
        ],
        [
          {
            ...mockPullRequest,
            id: 101,
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

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('diff --git'))).toBe(true);
  });

  it('should fail when no ID provided and branch not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'other-branch' });
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should display diffstat when --stat flag is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', stat: true }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('files changed'))).toBe(true);
  });

  it('should display file names only when --name-only flag is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', nameOnly: true }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('src/file.ts'))).toBe(true);
    expect(output.logs.some((log) => log.includes('src/newfile.ts'))).toBe(
      true
    );
  });

  it('should return web diff URL in JSON when --web is set', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', web: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('web');
    expect(parsed.url).toBe(
      'https://bitbucket.org/workspace/repo/pull-requests/1/diff'
    );
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should reject a non-integer PR ID with VALIDATION_INVALID', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    try {
      await command.execute({ id: 'abc' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(BBError);
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(err.context).toEqual({ id: 'abc' });
    }
  });

  it('should emit diffstat JSON including totals when --stat --json', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', stat: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('stat');
    expect(parsed.pullRequestId).toBe(1);
    expect(parsed.files).toHaveLength(2);
    expect(parsed.filesChanged).toBe(2);
    expect(parsed.totalAdditions).toBe(2);
    expect(parsed.totalDeletions).toBe(2);
  });

  it('should emit name-only JSON with the list of file paths', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', nameOnly: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('name-only');
    expect(parsed.files).toEqual(['src/file.ts', 'src/newfile.ts']);
  });

  it('should emit diff JSON with the raw diff string', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.mode).toBe('diff');
    expect(parsed.diff).toContain('diff --git');
    expect(parsed.diff).toContain('-Old content');
    expect(parsed.diff).toContain('+New content');
  });

  it('should render a summary line with file/addition/deletion counts in stat mode', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', stat: true }, { globalOptions: {} });

    const summary = output.logs.find((log) => log.includes('files changed'));
    expect(summary).toBeDefined();
    expect(summary).toContain('2 files changed');
    expect(summary).toContain('insertions');
    expect(summary).toContain('deletions');
  });

  it('should use singular "file changed" for a single-file stat', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    // Override diffstat to return only one file.
    (
      pullrequestsApi as any
    ).repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet =
      async () =>
        ({
          data: {
            values: new Set([
              {
                new: { path: 'only.ts' },
                lines_added: 1,
                lines_removed: 0,
              },
            ]),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }) as any;

    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute({ id: '1', stat: true }, { globalOptions: {} });

    const summary = output.logs.find((log) => log.includes('file changed'));
    expect(summary).toBeDefined();
    expect(summary).toContain('1 file changed');
  });

  it('should pass the URL verbatim to open() without shell interpolation when --web is set', async () => {
    const openCalls: string[] = [];
    mock.module('open', () => ({
      default: async (url: string) => {
        openCalls.push(url);
      },
    }));

    const maliciousUrl =
      'https://bitbucket.org/workspace/repo/pull-requests/1/?x=" & echo pwned `id`';
    const prs = [
      {
        ...mockPullRequest,
        links: { html: { href: maliciousUrl } },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    const originalIsTTY = process.stdout.isTTY;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });
    try {
      await command.execute({ id: '1', web: true }, { globalOptions: {} });
    } finally {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        configurable: true,
      });
    }

    expect(openCalls).toHaveLength(1);
    expect(openCalls[0]).toBe(`${maliciousUrl}/diff`);
  });

  it('should print the --web URL instead of opening a browser when stdout is not a terminal', async () => {
    const openCalls: string[] = [];
    mock.module('open', () => ({
      default: async (url: string) => {
        openCalls.push(url);
      },
    }));

    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();
    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    const originalIsTTY = process.stdout.isTTY;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: undefined,
      configurable: true,
    });
    try {
      await command.execute({ id: '1', web: true }, { globalOptions: {} });
    } finally {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        configurable: true,
      });
    }

    expect(openCalls).toEqual([]);
    expect(output.logs).toHaveLength(1);
    expect(output.logs[0]).toMatch(/^text:https:\/\/.+\/diff$/);
  });

  it('should use the PR html link when building a --web URL', async () => {
    const prs = [
      {
        ...mockPullRequest,
        links: {
          html: {
            href: 'https://bitbucket.org/workspace/repo/pull-requests/1/',
          },
        },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', web: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.substring(5));
    // Trailing slash stripped, /diff appended.
    expect(parsed.url).toBe(
      'https://bitbucket.org/workspace/repo/pull-requests/1/diff'
    );
  });
});
