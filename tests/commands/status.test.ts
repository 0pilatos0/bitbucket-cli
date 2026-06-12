/**
 * Status (commit build status) command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListCommitStatusesCommand } from '../../src/commands/status/list.command.js';
import { SetCommitStatusCommand } from '../../src/commands/status/set.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { colorStatusState } from '../../src/commands/status/shared.js';
import { APIError } from '../../src/types/errors.js';
import type {
  CommitStatusesApi,
  Commitstatus,
} from '../../src/generated/api.js';

const mockStatus: Commitstatus = {
  type: 'build',
  key: 'CI',
  state: 'SUCCESSFUL',
  name: 'CI Build #7',
  description: 'All tests passed',
  url: 'https://ci.example.com/builds/7',
  refname: 'main',
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-01T00:05:00.000Z',
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

function createMockCommitStatusesApi(
  options: {
    statuses?: Commitstatus[];
    commitNotFound?: boolean;
    postError?: APIError;
    onList?: (request: unknown, axiosOptions?: unknown) => void;
    onPost?: (request: unknown) => void;
    onPut?: (request: unknown) => void;
  } = {}
): CommitStatusesApi {
  const statuses = options.statuses ?? [mockStatus];

  return {
    repositoriesWorkspaceRepoSlugCommitCommitStatusesGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      if (options.commitNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.onList?.(request, axiosOptions);
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      return {
        data: {
          values: statuses.slice(start, end),
          page,
          pagelen,
          size: statuses.length,
          next:
            end < statuses.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/commit/abc/statuses?page=${page + 1}`
              : undefined,
        },
      };
    },
    repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost: async (
      request: unknown
    ) => {
      if (options.commitNotFound) {
        throw new APIError('Resource not found', 404);
      }
      if (options.postError) {
        throw options.postError;
      }
      options.onPost?.(request);
      const { commitstatus } = request as { commitstatus: Commitstatus };
      return { data: { ...mockStatus, ...commitstatus } };
    },
    repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut: async (
      request: unknown
    ) => {
      options.onPut?.(request);
      const { commitstatus } = request as { commitstatus: Commitstatus };
      return { data: { ...mockStatus, ...commitstatus } };
    },
  } as unknown as CommitStatusesApi;
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

describe('ListCommitStatusesCommand', () => {
  it('should render the statuses table with key, state, name, description, and url', async () => {
    const output = createMockOutputService();
    const command = new ListCommitStatusesCommand(
      createMockCommitStatusesApi(),
      repoContextService(),
      output
    );

    await command.execute({ sha: 'abc1234' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('table:KEY,STATE,NAME,DESCRIPTION,URL')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      'CI',
      'SUCCESSFUL',
      'CI Build #7',
      'All tests passed',
      'https://ci.example.com/builds/7',
    ]);
  });

  it('should emit the JSON envelope with metadata-first key order', async () => {
    const output = createMockOutputService();
    const command = new ListCommitStatusesCommand(
      createMockCommitStatusesApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { sha: 'abc1234' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'commit',
      'count',
      'statuses',
    ]);
    expect(payload.commit).toBe('abc1234');
    expect(payload.count).toBe(1);
    expect(payload.statuses).toHaveLength(1);
  });

  it('should pass pagination params through axios options', async () => {
    let capturedAxios: unknown;
    const output = createMockOutputService();
    const command = new ListCommitStatusesCommand(
      createMockCommitStatusesApi({
        onList: (_request, axiosOptions) => {
          capturedAxios = axiosOptions;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { sha: 'abc1234', limit: '10' },
      { globalOptions: {} }
    );

    expect(extractPaginationParams(capturedAxios)).toEqual({
      page: 1,
      pagelen: 10,
    });
  });

  it('should show the empty-state message when the commit has no statuses', async () => {
    const output = createMockOutputService();
    const command = new ListCommitStatusesCommand(
      createMockCommitStatusesApi({ statuses: [] }),
      repoContextService(),
      output
    );

    await command.execute({ sha: 'abc1234' }, { globalOptions: {} });

    expect(output.logs).toContain('info:No statuses found for commit abc1234');
  });

  it('should surface a contextual 404 error for unknown commits', async () => {
    const output = createMockOutputService();
    const command = new ListCommitStatusesCommand(
      createMockCommitStatusesApi({ commitNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ sha: 'deadbee' }, { globalOptions: {} })
    ).rejects.toThrow('Commit deadbee not found in workspace/repo.');
  });
});

describe('SetCommitStatusCommand', () => {
  it('should POST a typed build status and print a success message', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi({
        onPost: (request) => {
          captured = request;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      {
        sha: 'abc1234def567890',
        key: 'CI',
        state: 'SUCCESSFUL',
        url: 'https://ci.example.com/builds/8',
        name: 'CI Build #8',
        description: 'All green',
        refname: 'main',
      },
      { globalOptions: {} }
    );

    expect(captured).toEqual({
      commit: 'abc1234def567890',
      repoSlug: 'repo',
      workspace: 'workspace',
      commitstatus: {
        type: 'build',
        key: 'CI',
        state: 'SUCCESSFUL',
        url: 'https://ci.example.com/builds/8',
        name: 'CI Build #8',
        description: 'All green',
        refname: 'main',
      },
    });
    expect(output.logs).toContain(
      'success:Status CI set to SUCCESSFUL on abc1234'
    );
  });

  it('should fall back to PUT when the POST is rejected (duplicate key), making set idempotent', async () => {
    let putCaptured: unknown;
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi({
        postError: new APIError(
          'Status with key CI already exists on this commit',
          400
        ),
        onPut: (request) => {
          putCaptured = request;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { sha: 'abc1234def567890', key: 'CI', state: 'failed' },
      { globalOptions: {} }
    );

    expect(putCaptured).toEqual({
      commit: 'abc1234def567890',
      key: 'CI',
      repoSlug: 'repo',
      workspace: 'workspace',
      commitstatus: { type: 'build', key: 'CI', state: 'FAILED' },
    });
    expect(output.logs).toContain('success:Status CI set to FAILED on abc1234');
  });

  it('should not fall back to PUT on auth errors', async () => {
    let putCalled = false;
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi({
        postError: new APIError('Token is invalid or not supported', 401),
        onPut: () => {
          putCalled = true;
        },
      }),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { sha: 'abc1234', key: 'CI', state: 'SUCCESSFUL' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Token is invalid or not supported');
    expect(putCalled).toBe(false);
  });

  it('should emit the JSON envelope wrapping the resulting status', async () => {
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { sha: 'abc1234', key: 'CI', state: 'INPROGRESS' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'commit',
      'status',
    ]);
    expect((payload.status as Commitstatus).key).toBe('CI');
    expect((payload.status as Commitstatus).state).toBe('INPROGRESS');
  });

  it('should reject an invalid --state value with the allowed list', async () => {
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { sha: 'abc1234', key: 'CI', state: 'GREENISH' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--state must be one of');
  });

  it('should require --key', async () => {
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { sha: 'abc1234', state: 'SUCCESSFUL' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Option --key is required');
  });

  it('should surface a contextual 404 error for unknown commits', async () => {
    const output = createMockOutputService();
    const command = new SetCommitStatusCommand(
      createMockCommitStatusesApi({ commitNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { sha: 'deadbee', key: 'CI', state: 'SUCCESSFUL' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Commit deadbee not found in workspace/repo.');
  });
});

describe('colorStatusState', () => {
  const taggingOutput = {
    ...createMockOutputService(),
    green: (text: string) => `green(${text})`,
    red: (text: string) => `red(${text})`,
    yellow: (text: string) => `yellow(${text})`,
    gray: (text: string) => `gray(${text})`,
  };

  it('colors each known state with its severity color', () => {
    expect(colorStatusState(taggingOutput, 'SUCCESSFUL')).toBe(
      'green(SUCCESSFUL)'
    );
    expect(colorStatusState(taggingOutput, 'FAILED')).toBe('red(FAILED)');
    expect(colorStatusState(taggingOutput, 'INPROGRESS')).toBe(
      'yellow(INPROGRESS)'
    );
    expect(colorStatusState(taggingOutput, 'STOPPED')).toBe('gray(STOPPED)');
  });

  it('matches states case-insensitively', () => {
    expect(colorStatusState(taggingOutput, 'failed')).toBe('red(failed)');
  });

  it('renders unknown or missing states as a gray dash', () => {
    expect(colorStatusState(taggingOutput, 'MYSTERY')).toBe('gray(MYSTERY)');
    expect(colorStatusState(taggingOutput, undefined)).toBe('gray(-)');
  });
});
