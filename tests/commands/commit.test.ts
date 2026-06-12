/**
 * Commit command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListCommitsCommand } from '../../src/commands/commit/list.command.js';
import { ViewCommitCommand } from '../../src/commands/commit/view.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type { Commit, CommitsApi } from '../../src/generated/api.js';

const mockCommit: Commit = {
  type: 'commit',
  hash: 'abc1234def5678900000000000000000000000000',
  date: '2024-01-01T00:00:00.000Z',
  message: 'feat: add the thing\n\nLonger body explaining the thing.',
  author: {
    type: 'author',
    raw: 'Test User <test@example.com>',
    user: { type: 'user', display_name: 'Test User' },
  },
  parents: [
    {
      type: 'commit',
      hash: '1112223334445556667778889990001112223334',
    },
  ],
};

const mockRawAuthorCommit: Commit = {
  type: 'commit',
  hash: 'fff111222333444555666777888999000aaabbbc',
  date: '2024-01-02T00:00:00.000Z',
  message: 'fix: another thing',
  author: {
    type: 'author',
    raw: 'Raw Person <raw@example.com>',
  },
  parents: [],
};

function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  const params = (
    axiosOptions as { params?: { page?: number; pagelen?: number } }
  )?.params;
  return { page: params?.page ?? 1, pagelen: params?.pagelen ?? 25 };
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }
  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

function createMockCommitsApi(
  options: {
    commits?: Commit[];
    commitNotFound?: boolean;
    revisionNotFound?: boolean;
    onRevisionList?: (request: unknown, axiosOptions?: unknown) => void;
    onDefaultList?: (request: unknown, axiosOptions?: unknown) => void;
  } = {}
): CommitsApi {
  const commits = options.commits ?? [mockCommit];

  const paginate = (page: number, pagelen: number) => {
    const start = (page - 1) * pagelen;
    const end = start + pagelen;
    return {
      values: commits.slice(start, end),
      page,
      pagelen,
      size: commits.length,
      next:
        end < commits.length
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/commits?page=${page + 1}`
          : undefined,
    };
  };

  return {
    repositoriesWorkspaceRepoSlugCommitsRevisionGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      if (options.revisionNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.onRevisionList?.(request, axiosOptions);
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      return { data: paginate(page, pagelen) };
    },
    repositoriesWorkspaceRepoSlugCommitsGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      options.onDefaultList?.(request, axiosOptions);
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      return { data: paginate(page, pagelen) };
    },
    repositoriesWorkspaceRepoSlugCommitCommitGet: async ({
      commit,
    }: {
      commit: string;
    }) => {
      if (options.commitNotFound) {
        throw new APIError('Resource not found', 404);
      }
      return {
        data: commits.find((c) => c.hash?.startsWith(commit)) ?? mockCommit,
      };
    },
  } as unknown as CommitsApi;
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

describe('ListCommitsCommand', () => {
  it('should render the commits table with short hash, first message line, author, and date', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi(),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('table:HASH,MESSAGE,AUTHOR,DATE')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]).toBe('abc1234');
    expect(rows[0]![1]).toBe('feat: add the thing');
    expect(rows[0]![2]).toBe('Test User');
    expect(rows[0]![3]).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should default to the current git branch as the revision', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({
        onRevisionList: (request) => {
          captured = request;
        },
      }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'feature/login' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      revision: 'feature/login',
    });
  });

  it('should fall back to the default commit listing when branch detection fails', async () => {
    let revisionCalled = false;
    let defaultCalled = false;
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({
        onRevisionList: () => {
          revisionCalled = true;
        },
        onDefaultList: () => {
          defaultCalled = true;
        },
      }),
      repoContextService(),
      createMockGitService({ throwOnGetCurrentBranch: true }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(revisionCalled).toBe(false);
    expect(defaultCalled).toBe(true);
  });

  it('should prefer an explicit --ref over the current git branch', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({
        onRevisionList: (request) => {
          captured = request;
        },
      }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({ ref: 'v1.0.0' }, { globalOptions: {} });

    expect((captured as { revision?: string }).revision).toBe('v1.0.0');
  });

  it('should emit the JSON envelope with metadata-first key order', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi(),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'ref',
      'count',
      'commits',
    ]);
    expect(payload.workspace).toBe('workspace');
    expect(payload.repoSlug).toBe('repo');
    expect(payload.ref).toBe('main');
    expect(payload.count).toBe(1);
    expect(payload.commits).toHaveLength(1);
  });

  it('should omit ref from the JSON envelope when listing the repository default', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi(),
      repoContextService(),
      createMockGitService({ throwOnGetCurrentBranch: true }),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'count',
      'commits',
    ]);
  });

  it('should show the empty-state message when no commits exist', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({ commits: [] }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain("info:No commits found on 'main'");
  });

  it('should respect --limit and print the more-results hint', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...mockCommit,
      hash: `${i}aaabbbcccdddeeefff00011122233344455566`,
    }));
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({ commits: many }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({ limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
    expect(
      output.logs.some((log) =>
        log.includes('Showing 2 commits. Use --limit <n> or --all to see more.')
      )
    ).toBe(true);
  });

  it('should fall back to parsing the raw author when no Bitbucket account matched', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({ commits: [mockRawAuthorCommit] }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]![2]).toBe('Raw Person');
  });

  it('should surface a contextual error when the ref does not exist', async () => {
    const output = createMockOutputService();
    const command = new ListCommitsCommand(
      createMockCommitsApi({ revisionNotFound: true }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'gone-branch' }),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      "Ref 'gone-branch' not found in workspace/repo."
    );
  });
});

describe('ViewCommitCommand', () => {
  it('should render hash, author, date, parents, and the full message', async () => {
    const output = createMockOutputService();
    const command = new ViewCommitCommand(
      createMockCommitsApi(),
      repoContextService(),
      output
    );

    await command.execute({ sha: 'abc1234' }, { globalOptions: {} });

    const text = output.logs.join('\n');
    expect(text).toContain('abc1234def5678900000000000000000000000000');
    expect(text).toContain('Test User <test@example.com>');
    expect(text).toContain('1112223');
    expect(text).toContain('feat: add the thing');
    expect(text).toContain('Longer body explaining the thing.');
  });

  it('should emit the JSON envelope with the raw commit resource', async () => {
    const output = createMockOutputService();
    const command = new ViewCommitCommand(
      createMockCommitsApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { sha: 'abc1234' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'commit']);
    expect((payload.commit as Commit).hash).toBe(
      'abc1234def5678900000000000000000000000000'
    );
  });

  it('should surface a contextual 404 error for unknown commits', async () => {
    const output = createMockOutputService();
    const command = new ViewCommitCommand(
      createMockCommitsApi({ commitNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ sha: 'deadbee' }, { globalOptions: {} })
    ).rejects.toThrow('Commit deadbee not found in workspace/repo.');
  });
});
