/**
 * Integration tests for `bb repo cat` / `bb repo ls`: real generated
 * SourceApi/CommitsApi + real axios stack against the mock Bitbucket server,
 * so path encoding, raw-byte responses, and cursor pagination are checked on
 * the wire rather than against stubs.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import { CommitsApi, SourceApi } from '../../src/generated/api.js';
import { CatRepoFileCommand } from '../../src/commands/repo/cat.command.js';
import { ListRepoFilesCommand } from '../../src/commands/repo/ls.command.js';
import type { IOutputService } from '../../src/core/interfaces/services.js';
import {
  buildApiFor,
  startMockBitbucket,
  type MockBitbucketServer,
  type MockRoute,
} from '../helpers/mock-bitbucket.js';
import {
  createMockContextService,
  createMockCredentialStoreOnly,
  createMockOutputService,
} from '../setup.js';

const HASH = '0123456789abcdef0123456789abcdef01234567';
const SRC_PREFIX = '/repositories/workspace/repo/src/';
const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

async function startHarness(routes: MockRoute[]): Promise<MockBitbucketServer> {
  const server = await startMockBitbucket({ routes, latencyMs: 0 });
  servers.push(server);
  return server;
}

function wire(server: MockBitbucketServer, output: IOutputService) {
  const credentialStore = createMockCredentialStoreOnly({
    username: 'tester',
    apiToken: 'test-token',
  });
  const sourceApi = buildApiFor(server.url, credentialStore, output, SourceApi);
  const commitsApi = buildApiFor(
    server.url,
    credentialStore,
    output,
    CommitsApi
  );
  const contextService = createMockContextService({
    workspace: 'workspace',
    repoSlug: 'repo',
  });
  return {
    cat: new CatRepoFileCommand(sourceApi, commitsApi, contextService, output),
    ls: new ListRepoFilesCommand(sourceApi, commitsApi, contextService, output),
  };
}

describe('mock Bitbucket integration (repo cat)', () => {
  it('streams a nested binary file byte-for-byte after the meta lookup', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x0a]);
    const server = await startHarness([
      {
        method: 'GET',
        matchPathname: (pathname) =>
          decodeURIComponent(pathname) === `${SRC_PREFIX}HEAD/assets/logo.png`,
        respond: () => ({
          body: {
            type: 'commit_file',
            path: 'assets/logo.png',
            commit: { hash: HASH },
          },
        }),
      },
      {
        method: 'GET',
        matchPathname: (pathname) =>
          decodeURIComponent(pathname) ===
          `${SRC_PREFIX}${HASH}/assets/logo.png`,
        respond: () => ({
          body: bytes,
          headers: { 'content-type': 'image/png' },
        }),
      },
    ]);
    const written: Uint8Array[] = [];
    const output: IOutputService = {
      ...createMockOutputService(),
      raw: (data: Uint8Array) => written.push(data),
    };
    const { cat } = wire(server, output);

    await cat.run({ path: 'assets/logo.png' }, { globalOptions: {} });

    expect(server.requests.map((r) => r.query.get('format'))).toEqual([
      'meta',
      null,
    ]);
    expect(written).toHaveLength(1);
    expect(Array.from(written[0]!)).toEqual(Array.from(bytes));
  });

  it('maps a Bitbucket 404 to a message naming the path and ref', async () => {
    const server = await startHarness([
      {
        method: 'GET',
        matchPathname: (pathname) => pathname.startsWith(SRC_PREFIX),
        respond: () => ({
          status: 404,
          body: {
            type: 'error',
            error: { message: 'No such file or directory: nope.txt' },
          },
        }),
      },
    ]);
    const { cat } = wire(server, createMockOutputService());

    await expect(
      cat.run({ path: 'nope.txt', ref: 'main' }, { globalOptions: {} })
    ).rejects.toThrow(
      "Path 'nope.txt' not found at ref 'main' in workspace/repo."
    );
  });
});

describe('mock Bitbucket integration (repo ls)', () => {
  it('walks the opaque page cursor from each next link', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      type: 'commit_file',
      path: `f${i}.txt`,
      size: i,
    }));
    const server = await startHarness([
      {
        method: 'GET',
        matchPathname: (pathname) => pathname === `${SRC_PREFIX}HEAD/`,
        respond: ({ query }) => {
          const cursor = query.get('page');
          if (cursor !== null && !cursor.startsWith('tok')) {
            return {
              status: 400,
              body: { error: { message: 'Invalid page' } },
            };
          }
          const start = cursor ? Number.parseInt(cursor.slice(3), 10) : 0;
          const end = start + 2;
          return {
            body: {
              pagelen: 2,
              values: entries.slice(start, end),
              ...(end < entries.length && {
                next: `${server.url}${SRC_PREFIX}HEAD/?pagelen=2&page=tok${end}`,
              }),
            },
          };
        },
      },
    ]);
    const output = createMockOutputService();
    const { ls } = wire(server, output);

    await ls.run({ all: true }, { globalOptions: { json: true } });

    expect(server.requests.map((r) => r.query.get('page'))).toEqual([
      null,
      'tok2',
      'tok4',
    ]);
    const json = output.logs.find((log) => log.startsWith('json:'))!;
    const payload = JSON.parse(json.slice('json:'.length)) as {
      count: number;
      entries: { path: string }[];
    };
    expect(payload.count).toBe(5);
    expect(payload.entries.map((e) => e.path)).toEqual(
      entries.map((e) => e.path)
    );
  });
});
