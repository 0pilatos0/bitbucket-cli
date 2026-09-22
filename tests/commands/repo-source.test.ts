/**
 * Repository source command tests (repo cat, repo ls)
 */

import { describe, it, expect } from 'bun:test';
import { CatRepoFileCommand } from '../../src/commands/repo/cat.command.js';
import { ListRepoFilesCommand } from '../../src/commands/repo/ls.command.js';
import type {
  CommitsApi,
  SourceApi,
  Treeentry,
} from '../../src/generated/api.js';
import type { IOutputService } from '../../src/core/interfaces/services.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import { createMockContextService, createMockOutputService } from '../setup.js';

const HASH = 'abc123def4567890abc123def4567890abc12345';
const BRANCH_HASH = 'fff000fff000fff000fff000fff000fff000fff0';

interface SrcCall {
  commit: string;
  path: string;
  format?: string;
  params?: Record<string, unknown>;
  responseType?: string;
}

function fileEntry(path: string, size: number): Treeentry {
  return {
    type: 'commit_file',
    path,
    size,
    commit: { type: 'commit', hash: HASH },
  };
}

function dirEntry(path: string): Treeentry {
  return {
    type: 'commit_directory',
    path,
    commit: { type: 'commit', hash: HASH },
  };
}

function createMockSourceApi(
  options: {
    entries?: Record<string, Treeentry>;
    files?: Record<string, Uint8Array>;
    listings?: Record<string, Treeentry[]>;
    pageSize?: number;
  } = {}
): { api: SourceApi; calls: SrcCall[] } {
  const calls: SrcCall[] = [];
  const api = {
    repositoriesWorkspaceRepoSlugSrcCommitPathGet: async (
      request: { commit: string; path: string; format?: string },
      axiosOptions?: {
        params?: Record<string, unknown>;
        responseType?: string;
      }
    ) => {
      calls.push({
        commit: request.commit,
        path: request.path,
        format: request.format,
        params: axiosOptions?.params,
        responseType: axiosOptions?.responseType,
      });

      if (request.format === 'meta') {
        const entry = options.entries?.[request.path];
        if (!entry) {
          throw new APIError('No such file or directory', 404);
        }
        return { data: entry };
      }

      const file = options.files?.[request.path];
      if (file) {
        return { data: file.buffer };
      }

      const listing = options.listings?.[request.path];
      if (!listing) {
        throw new APIError('Commit not found', 404);
      }
      // Cursor pagination: the `page` param is an opaque token naming the
      // offset, and numeric page numbers are rejected like the real API.
      const pageSize = options.pageSize ?? listing.length;
      const token = axiosOptions?.params?.page as string | undefined;
      if (typeof axiosOptions?.params?.page === 'number') {
        throw new APIError('Invalid page', 400);
      }
      const start = token ? Number.parseInt(token.slice(3), 10) : 0;
      const end = start + pageSize;
      return {
        data: {
          pagelen: pageSize,
          values: new Set(listing.slice(start, end)),
          next:
            end < listing.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/src/${request.commit}/${request.path}?pagelen=${pageSize}&page=cur${end}`
              : undefined,
        },
      };
    },
  } as unknown as SourceApi;
  return { api, calls };
}

function createMockCommitsApi(heads: Record<string, string> = {}): {
  api: CommitsApi;
  revisions: string[];
} {
  const revisions: string[] = [];
  const api = {
    repositoriesWorkspaceRepoSlugCommitsRevisionGet: async ({
      revision,
    }: {
      revision: string;
    }) => {
      revisions.push(revision);
      const hash = heads[revision];
      if (!hash) {
        throw new APIError('Resource not found', 404);
      }
      return { data: { values: [{ hash }] } };
    },
  } as unknown as CommitsApi;
  return { api, revisions };
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  return rowsLog
    ? (JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][])
    : [];
}

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('CatRepoFileCommand', () => {
  it('prints the raw file contents at the main branch by default', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { 'src/index.ts': fileEntry('src/index.ts', 12) },
      files: { 'src/index.ts': encode('console.log(1)\n') },
    });
    const commits = createMockCommitsApi();
    const cmd = new CatRepoFileCommand(
      api,
      commits.api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'src/index.ts' }, { globalOptions: {} });

    expect(output.logs).toEqual(['raw:console.log(1)\n']);
    expect(calls[0]).toMatchObject({
      commit: 'HEAD',
      path: 'src/index.ts',
      format: 'meta',
    });
    expect(calls[1]).toMatchObject({
      commit: HASH,
      path: 'src/index.ts',
      format: undefined,
      responseType: 'arraybuffer',
    });
    expect(commits.revisions).toEqual([]);
  });

  it('passes the exact bytes of a binary file through', async () => {
    const raw: Uint8Array[] = [];
    const output: IOutputService = {
      ...createMockOutputService(),
      raw: (data: Uint8Array) => raw.push(data),
    };
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
    const { api } = createMockSourceApi({
      entries: { 'logo.png': fileEntry('logo.png', bytes.length) },
      files: { 'logo.png': bytes },
    });
    const cmd = new CatRepoFileCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'logo.png' }, { globalOptions: {} });

    expect(raw).toHaveLength(1);
    expect(Array.from(raw[0]!)).toEqual(Array.from(bytes));
  });

  it('uses a slash-free --ref directly', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { 'README.md': fileEntry('README.md', 3) },
      files: { 'README.md': encode('hi\n') },
    });
    const commits = createMockCommitsApi();
    const cmd = new CatRepoFileCommand(
      api,
      commits.api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'README.md', ref: 'v1.0.0' }, { globalOptions: {} });

    expect(calls[0]!.commit).toBe('v1.0.0');
    expect(commits.revisions).toEqual([]);
  });

  it('resolves a --ref containing a slash to its head commit first', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { 'README.md': fileEntry('README.md', 3) },
      files: { 'README.md': encode('hi\n') },
    });
    const commits = createMockCommitsApi({ 'feature/x': BRANCH_HASH });
    const cmd = new CatRepoFileCommand(
      api,
      commits.api,
      repoContextService(),
      output
    );

    await cmd.run(
      { path: 'README.md', ref: 'feature/x' },
      { globalOptions: {} }
    );

    expect(commits.revisions).toEqual(['feature/x']);
    expect(calls[0]!.commit).toBe(BRANCH_HASH);
  });

  it('names the ref when a slashed --ref does not exist', async () => {
    const output = createMockOutputService();
    const cmd = new CatRepoFileCommand(
      createMockSourceApi().api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await expect(
      cmd.run({ path: 'README.md', ref: 'nope/nope' }, { globalOptions: {} })
    ).rejects.toThrow("Ref 'nope/nope' not found in workspace/repo.");
  });

  it('strips leading and trailing slashes from the path', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { 'docs/a.md': fileEntry('docs/a.md', 1) },
      files: { 'docs/a.md': encode('a') },
    });
    const cmd = new CatRepoFileCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ path: '/docs/a.md' }, { globalOptions: {} });

    expect(calls.map((call) => call.path)).toEqual(['docs/a.md', 'docs/a.md']);
  });

  it('rejects an empty path', async () => {
    const output = createMockOutputService();
    const cmd = new CatRepoFileCommand(
      createMockSourceApi().api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    const error = await cmd
      .run({ path: '/' }, { globalOptions: {} })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
  });

  it('points at repo ls when the path is a directory', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { src: dirEntry('src') },
    });
    const cmd = new CatRepoFileCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    const error = await cmd
      .run({ path: 'src' }, { globalOptions: {} })
      .catch((e: unknown) => e);

    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    expect((error as Error).message).toContain('bb repo ls src');
    expect(calls).toHaveLength(1);
  });

  it('names the path and ref when the file does not exist', async () => {
    const output = createMockOutputService();
    const cmd = new CatRepoFileCommand(
      createMockSourceApi().api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await expect(
      cmd.run({ path: 'missing.txt', ref: 'main' }, { globalOptions: {} })
    ).rejects.toThrow(
      "Path 'missing.txt' not found at ref 'main' in workspace/repo."
    );
  });

  it('emits UTF-8 text content in JSON mode', async () => {
    const output = createMockOutputService();
    const { api } = createMockSourceApi({
      entries: { 'README.md': fileEntry('README.md', 6) },
      files: { 'README.md': encode('héllo\n') },
    });
    const cmd = new CatRepoFileCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'README.md' }, { globalOptions: { json: true } });

    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      ref: 'HEAD',
      commit: HASH,
      path: 'README.md',
      size: 7,
      encoding: 'utf-8',
      content: 'héllo\n',
    });
  });

  it('emits non-UTF-8 content as base64 in JSON mode', async () => {
    const output = createMockOutputService();
    const bytes = new Uint8Array([0xff, 0xfe, 0x00]);
    const { api } = createMockSourceApi({
      entries: { 'blob.bin': fileEntry('blob.bin', 3) },
      files: { 'blob.bin': bytes },
    });
    const cmd = new CatRepoFileCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'blob.bin' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(payload.encoding).toBe('base64');
    expect(payload.content).toBe(Buffer.from(bytes).toString('base64'));
  });
});

describe('ListRepoFilesCommand', () => {
  const rootListing = [
    dirEntry('src'),
    fileEntry('README.md', 42),
    fileEntry('package.json', 512),
  ];

  it('lists the repository root without a metadata lookup', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      listings: { '': rootListing },
    });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({}, { globalOptions: {} });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ commit: 'HEAD', path: '' });
    expect(output.logs).toContain('table:TYPE,SIZE,PATH');
    expect(getTableRows(output.logs)).toEqual([
      ['dir', '-', 'src/'],
      ['file', '42', 'README.md'],
      ['file', '512', 'package.json'],
    ]);
  });

  it('checks a subdirectory is a directory, then lists it at the pinned commit', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi({
      entries: { src: dirEntry('src') },
      listings: { src: [fileEntry('src/cli.ts', 10)] },
    });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ path: 'src/' }, { globalOptions: {} });

    expect(calls[0]).toMatchObject({
      commit: 'HEAD',
      path: 'src',
      format: 'meta',
    });
    expect(calls[1]).toMatchObject({ commit: HASH, path: 'src' });
    expect(getTableRows(output.logs)).toEqual([['file', '10', 'src/cli.ts']]);
  });

  it('points at repo cat when the path is a file', async () => {
    const output = createMockOutputService();
    const { api } = createMockSourceApi({
      entries: { 'README.md': fileEntry('README.md', 1) },
    });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await expect(
      cmd.run({ path: 'README.md' }, { globalOptions: {} })
    ).rejects.toThrow('bb repo cat README.md');
  });

  it('follows the opaque next cursor across pages with --all', async () => {
    const output = createMockOutputService();
    const listing = Array.from({ length: 7 }, (_, i) =>
      fileEntry(`f${i}.txt`, i)
    );
    const { api, calls } = createMockSourceApi({
      listings: { '': listing },
      pageSize: 3,
    });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ all: true }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(payload.count).toBe(7);
    expect(calls.map((call) => call.params?.page)).toEqual([
      undefined,
      'cur3',
      'cur6',
    ]);
  });

  it('caps at --limit and hints that more entries exist', async () => {
    const output = createMockOutputService();
    const listing = Array.from({ length: 5 }, (_, i) =>
      fileEntry(`f${i}.txt`, i)
    );
    const { api } = createMockSourceApi({
      listings: { '': listing },
      pageSize: 2,
    });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ limit: '3' }, { globalOptions: {} });

    expect(getTableRows(output.logs)).toHaveLength(3);
    expect(output.logs.some((log) => log.includes('Showing 3 entries'))).toBe(
      true
    );
  });

  it('emits the entries envelope in JSON mode', async () => {
    const output = createMockOutputService();
    const { api } = createMockSourceApi({ listings: { '': rootListing } });
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await cmd.run({ ref: 'main' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'ref',
      'path',
      'count',
      'entries',
    ]);
    expect(payload.ref).toBe('main');
    expect(payload.count).toBe(3);
  });

  it('names the ref when the root listing 404s', async () => {
    const output = createMockOutputService();
    const cmd = new ListRepoFilesCommand(
      createMockSourceApi().api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await expect(
      cmd.run({ ref: 'nope' }, { globalOptions: {} })
    ).rejects.toThrow("Ref 'nope' not found in workspace/repo.");
  });

  it('validates --limit before any request', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSourceApi();
    const cmd = new ListRepoFilesCommand(
      api,
      createMockCommitsApi().api,
      repoContextService(),
      output
    );

    await expect(
      cmd.run({ limit: 'zero' }, { globalOptions: {} })
    ).rejects.toThrow('--limit must be a positive integer');
    expect(calls).toHaveLength(0);
  });
});
