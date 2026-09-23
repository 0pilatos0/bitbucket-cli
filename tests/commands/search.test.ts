/**
 * Search command tests
 */

import { describe, it, expect } from 'bun:test';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { SearchCodeCommand } from '../../src/commands/search/code.command.js';
import {
  createMockAdapter,
  createMockContextService,
  createMockOutputService,
} from '../setup.js';
import { APIError, ErrorCode } from '../../src/types/errors.js';
import {
  SearchApi,
  type SearchCodeSearchResult,
} from '../../src/generated/api.js';

const mockResult: SearchCodeSearchResult = {
  type: 'code_search_result',
  content_match_count: 1,
  content_matches: [
    {
      lines: [
        { line: 2, segments: [] },
        {
          line: 3,
          segments: [
            { text: '  def ' },
            { text: 'foo', match: true },
            { text: '():' },
          ],
        },
      ],
    },
  ],
  path_matches: [{ text: 'src/foo.py' }],
  file: {
    type: 'commit_file',
    path: 'src/foo.py',
    commit: {
      type: 'commit',
      repository: { type: 'repository', full_name: 'acme/demo' },
    },
  },
};

interface SearchCall {
  request: {
    workspace?: string;
    searchQuery?: string;
    page?: number;
    pagelen?: number;
  };
  axiosOptions?: { params?: Record<string, unknown> };
}

function createMockSearchApi(
  options: {
    results?: SearchCodeSearchResult[];
    error?: unknown;
    calls?: SearchCall[];
  } = {}
): SearchApi {
  const results = options.results ?? [mockResult];

  return {
    searchWorkspace: async (
      request: SearchCall['request'],
      axiosOptions?: SearchCall['axiosOptions']
    ) => {
      options.calls?.push({ request, axiosOptions });
      if (options.error) {
        throw options.error;
      }
      const page = request.page ?? 1;
      const pagelen = request.pagelen ?? 10;
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      return {
        data: {
          values: results.slice(start, end),
          page,
          pagelen,
          size: results.length,
          next: end < results.length ? `https://next?page=${page + 1}` : null,
        },
      };
    },
  } as unknown as SearchApi;
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  return rowsLog
    ? (JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][])
    : [];
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

describe('SearchCodeCommand', () => {
  it('renders repository, path, line and matched text', async () => {
    const output = createMockOutputService();
    const command = new SearchCodeCommand(
      createMockSearchApi(),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute({ query: ['foo'] }, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.startsWith('table:REPOSITORY,PATH,LINE'))
    ).toBe(true);
    expect(getTableRows(output.logs)).toEqual([
      ['acme/demo', 'src/foo.py', '3', 'def foo():'],
    ]);
  });

  it('joins query words and requests the repository of each match', async () => {
    const calls: SearchCall[] = [];
    const command = new SearchCodeCommand(
      createMockSearchApi({ calls }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await command.execute(
      { query: ['foo', 'lang:python'] },
      { globalOptions: {} }
    );

    expect(calls[0]?.request).toMatchObject({
      workspace: 'acme',
      searchQuery: 'foo lang:python',
      page: 1,
    });
    expect(calls[0]?.axiosOptions?.params).toEqual({
      fields: '+values.file.commit.repository',
    });
  });

  it('puts the query, pagination and fields on the wire through the generated client', async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const { adapter } = createMockAdapter(
      [{ status: 200, data: { values: [mockResult], size: 1 } }],
      { onRequest: (config) => requests.push(config) }
    );
    const command = new SearchCodeCommand(
      new SearchApi(
        undefined,
        'https://api.example.test/2.0',
        axios.create({ adapter })
      ),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await command.execute(
      { query: ['foo'], limit: '5' },
      { globalOptions: { repo: 'demo' } }
    );

    const url = new URL(axios.getUri(requests[0]));
    expect(url.pathname).toBe('/2.0/workspaces/acme/search/code');
    expect(url.searchParams.get('search_query')).toBe('foo repo:demo');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('pagelen')).toBe('5');
    expect(url.searchParams.get('fields')).toBe(
      '+values.file.commit.repository'
    );
  });

  it('scopes the query to --repo', async () => {
    const calls: SearchCall[] = [];
    const command = new SearchCodeCommand(
      createMockSearchApi({ calls }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await command.execute(
      { query: ['foo'] },
      { globalOptions: { repo: 'demo' } }
    );

    expect(calls[0]?.request.searchQuery).toBe('foo repo:demo');
  });

  it('prefers --workspace, then the git remote workspace', async () => {
    const calls: SearchCall[] = [];
    const fromGit = new SearchCodeCommand(
      createMockSearchApi({ calls }),
      createMockContextService({ workspace: 'git-ws', repoSlug: 'repo' }),
      createMockOutputService()
    );
    await fromGit.execute({ query: ['foo'] }, { globalOptions: {} });
    await fromGit.execute(
      { query: ['foo'], workspace: 'explicit' },
      { globalOptions: {} }
    );

    expect(calls.map((call) => call.request.workspace)).toEqual([
      'git-ws',
      'explicit',
    ]);
  });

  it('emits the { workspace, query, count, results } envelope', async () => {
    const output = createMockOutputService();
    const command = new SearchCodeCommand(
      createMockSearchApi(),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute(
      { query: ['foo'] },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'query',
      'count',
      'results',
    ]);
    expect(payload.query).toBe('foo');
    expect(payload.count).toBe(1);
  });

  it('shows the empty state', async () => {
    const output = createMockOutputService();
    const command = new SearchCodeCommand(
      createMockSearchApi({ results: [] }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute({ query: ['nothing'] }, { globalOptions: {} });

    expect(output.logs).toContain(
      'info:No code matches for "nothing" in workspace acme'
    );
  });

  it('leaves LINE and MATCH empty for a path-only match', async () => {
    const output = createMockOutputService();
    const command = new SearchCodeCommand(
      createMockSearchApi({
        results: [{ ...mockResult, content_matches: [] }],
      }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute({ query: ['foo'] }, { globalOptions: {} });

    expect(getTableRows(output.logs)).toEqual([
      ['acme/demo', 'src/foo.py', '', ''],
    ]);
  });

  it('explains a 404 as code search being unavailable', async () => {
    const command = new SearchCodeCommand(
      createMockSearchApi({ error: new APIError('Not found', 404) }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    const error = await command
      .execute({ query: ['foo'] }, { globalOptions: {} })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(APIError);
    expect((error as APIError).code).toBe(ErrorCode.API_NOT_FOUND);
    expect((error as APIError).message).toContain(
      'Code search is not available for workspace acme.'
    );
    expect((error as APIError).message).toContain(
      'https://bitbucket.org/search'
    );
  });

  it('passes other API errors through unchanged', async () => {
    const original = new APIError('Invalid search query', 400);
    const command = new SearchCodeCommand(
      createMockSearchApi({ error: original }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await expect(
      command.execute({ query: ['foo'] }, { globalOptions: {} })
    ).rejects.toBe(original);
  });

  it('rejects a blank query', async () => {
    const command = new SearchCodeCommand(
      createMockSearchApi(),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await expect(
      command.execute({ query: ['  '] }, { globalOptions: {} })
    ).rejects.toThrow('A search query is required.');
  });

  it('fails without a resolvable workspace', async () => {
    const command = new SearchCodeCommand(
      createMockSearchApi(),
      createMockContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ query: ['foo'] }, { globalOptions: {} })
    ).rejects.toThrow('No workspace specified');
  });
});
