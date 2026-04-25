/**
 * BrowseCommand tests
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { BrowseCommand } from '../../src/commands/browse.command.js';
import { UrlBuilderService } from '../../src/services/url-builder.service.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

const workspaceCtx = { workspace: 'acme', repoSlug: 'widgets' };

function buildCommand(
  options: Parameters<typeof createMockGitService>[0] & {
    inRepo?: boolean;
  } = { inRepo: true }
) {
  const inRepo = options.inRepo ?? true;
  const contextService = inRepo
    ? createMockContextService({
        workspace: workspaceCtx.workspace,
        repoSlug: workspaceCtx.repoSlug,
      })
    : createMockContextService();
  const gitService = createMockGitService(options);
  const urlBuilder = new UrlBuilderService();
  const output = createMockOutputService();
  const command = new BrowseCommand(
    contextService,
    gitService,
    urlBuilder,
    output
  );
  return { command, output, gitService };
}

function lastJsonPayload(logs: string[]): unknown {
  const log = [...logs].reverse().find((l) => l.startsWith('json:'));
  if (!log) return undefined;
  return JSON.parse(log.substring('json:'.length));
}

describe('BrowseCommand', () => {
  let openCalls: string[];

  beforeEach(() => {
    openCalls = [];
    mock.module('open', () => ({
      default: async (url: string) => {
        openCalls.push(url);
      },
    }));
  });

  describe('repo home', () => {
    it('returns the repo URL when no target or flag is given', async () => {
      const { command } = buildCommand();
      const result = await command.execute({}, { globalOptions: {} });

      expect(result.url).toBe('https://bitbucket.org/acme/widgets');
      expect(result.opened).toBe(true);
      expect(openCalls).toEqual(['https://bitbucket.org/acme/widgets']);
    });
  });

  describe('positional resolution', () => {
    it('treats a pure-digit target as a PR id', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { target: '217' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/217'
      );
    });

    it('treats a 7-40 hex target as a commit SHA', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { target: 'abc1234' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/commits/abc1234'
      );
    });

    it('treats a 40-character hex target as a commit SHA', async () => {
      const { command } = buildCommand();
      const sha = 'a'.repeat(40);
      const result = await command.execute(
        { target: sha },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        `https://bitbucket.org/acme/widgets/commits/${sha}`
      );
    });

    it('treats anything else as a path on the current branch', async () => {
      const { command } = buildCommand({ currentBranch: 'main' });
      const result = await command.execute(
        { target: 'src/cli.ts' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts'
      );
    });

    it('parses trailing :<line> as a line anchor on the file path', async () => {
      const { command } = buildCommand({ currentBranch: 'main' });
      const result = await command.execute(
        { target: 'src/cli.ts:42' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts#lines-42'
      );
    });

    it('falls back to HEAD when not in a git repo', async () => {
      const { command } = buildCommand({
        inRepo: false,
        throwOnGetCurrentBranch: true,
      });
      // Use --workspace/--repo to satisfy repo context outside git.
      const result = await command.execute(
        { target: 'README.md', workspace: 'acme', repo: 'widgets' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/HEAD/README.md'
      );
    });
  });

  describe('--branch', () => {
    it('opens the branch tree when used alone', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { branch: 'release/2.0' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/release%2F2.0/'
      );
    });

    it('combines with a positional path target', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { branch: 'release/2.0', target: 'src/cli.ts' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/release%2F2.0/src/cli.ts'
      );
    });

    it('overrides the current branch even with a path target', async () => {
      const { command } = buildCommand({ currentBranch: 'main' });
      const result = await command.execute(
        { branch: 'feat/x', target: 'src/cli.ts:7' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/src/feat%2Fx/src/cli.ts#lines-7'
      );
    });
  });

  describe('resource flags', () => {
    it('--pr opens the PR detail page', async () => {
      const { command } = buildCommand();
      const result = await command.execute({ pr: '42' }, { globalOptions: {} });
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/42'
      );
    });

    it('--prs opens the PR list', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { prs: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/'
      );
    });

    it('--pull-requests is an alias for --prs', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { pullRequests: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/'
      );
    });

    it('--branches opens the branches list', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { branches: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/branches/');
    });

    it('--commit <sha> opens the commit page', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { commit: 'deadbeef' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/commits/deadbeef'
      );
    });

    it('--commit (no value) defaults to current HEAD', async () => {
      const { command } = buildCommand({
        currentCommit: 'feedface000000000000',
      });
      const result = await command.execute(
        { commit: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/commits/feedface000000000000'
      );
    });

    it('--commits opens the commits list', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { commits: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/commits/');
    });

    it('--pipelines opens the pipelines home', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { pipelines: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/pipelines');
    });

    it('--pipeline <id> opens a specific pipeline run', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { pipeline: '123' },
        { globalOptions: {} }
      );
      expect(result.url).toBe(
        'https://bitbucket.org/acme/widgets/pipelines/results/123'
      );
    });

    it('--downloads opens the downloads page', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { downloads: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/downloads/');
    });

    it('--issue <id> opens an issue', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { issue: '12' },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/issues/12');
    });

    it('--issues opens the issue tracker list', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { issues: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/issues');
    });

    it('--wiki opens the wiki', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { wiki: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/wiki');
    });

    it('--settings opens the admin page', async () => {
      const { command } = buildCommand();
      const result = await command.execute(
        { settings: true },
        { globalOptions: {} }
      );
      expect(result.url).toBe('https://bitbucket.org/acme/widgets/admin');
    });
  });

  describe('output modes', () => {
    it('--no-browser prints the URL and does not open it', async () => {
      const { command, output } = buildCommand();
      const result = await command.execute(
        { browser: false, pr: '7' },
        { globalOptions: {} }
      );
      expect(result.opened).toBe(false);
      expect(openCalls).toEqual([]);
      expect(output.logs).toContain(
        'text:https://bitbucket.org/acme/widgets/pull-requests/7'
      );
    });

    it('--json emits {url} and does not open the browser', async () => {
      const { command, output } = buildCommand();
      const result = await command.execute(
        { pr: '7' },
        { globalOptions: { json: true } }
      );
      expect(result.opened).toBe(false);
      expect(openCalls).toEqual([]);
      expect(lastJsonPayload(output.logs)).toEqual({
        url: 'https://bitbucket.org/acme/widgets/pull-requests/7',
      });
    });

    it('opens the browser by default', async () => {
      const { command } = buildCommand();
      const result = await command.execute({ pr: '7' }, { globalOptions: {} });
      expect(result.opened).toBe(true);
      expect(openCalls).toEqual([
        'https://bitbucket.org/acme/widgets/pull-requests/7',
      ]);
    });
  });

  describe('flag validation', () => {
    it('rejects combining two resource flags', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute({ pr: '1', settings: true }, { globalOptions: {} })
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_INVALID,
      });
    });

    it('rejects a positional target alongside a resource flag', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute(
          { pr: '1', target: 'src/cli.ts' },
          { globalOptions: {} }
        )
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_INVALID,
      });
    });

    it('rejects --branch combined with a resource flag', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute({ pr: '1', branch: 'main' }, { globalOptions: {} })
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_INVALID,
      });
    });

    it('rejects non-positive --pr values', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute({ pr: '0' }, { globalOptions: {} })
      ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
      await expect(
        command.execute({ pr: 'abc' }, { globalOptions: {} })
      ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
    });

    it('rejects non-numeric --issue values', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute({ issue: 'foo' }, { globalOptions: {} })
      ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
    });

    it('rejects empty --pipeline values', async () => {
      const { command } = buildCommand();
      await expect(
        command.execute({ pipeline: '   ' }, { globalOptions: {} })
      ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
    });
  });

  describe('error paths', () => {
    it('throws when no repo context is available', async () => {
      const { command } = buildCommand({ inRepo: false });
      await expect(
        command.run({}, { globalOptions: {} })
      ).rejects.toBeInstanceOf(BBError);
    });
  });

  describe('security', () => {
    it('passes the URL verbatim to open() (no shell interpolation)', async () => {
      const { command } = buildCommand();
      await command.execute({ target: '217' }, { globalOptions: {} });
      expect(openCalls).toEqual([
        'https://bitbucket.org/acme/widgets/pull-requests/217',
      ]);
    });
  });
});
