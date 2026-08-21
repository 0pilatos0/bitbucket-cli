/**
 * Integration tests: real generated API client + real axios stack against a
 * local mock Bitbucket server (issue #264).
 *
 * Unlike the command unit tests (which inject `as unknown as SomeApi` stubs),
 * these drive actual commands through bootstrap-style wiring so endpoint
 * paths, query params, auth headers, pagination walking, retry behavior, and
 * error mapping are validated against the wire protocol — not against mocks
 * that share the implementation's assumptions.
 */

import { describe, expect, it, afterAll } from 'bun:test';
import { RepositoriesApi } from '../../src/generated/api.js';
import { ListReposCommand } from '../../src/commands/repo/list.command.js';
import { APIError } from '../../src/types/errors.js';
import {
  buildApiFor,
  makeRepo,
  repositoriesRoute,
  startMockBitbucket,
  type MockBitbucketServer,
} from '../helpers/mock-bitbucket.js';
import {
  createMockContextService,
  createMockCredentialStoreOnly,
  createMockOutputService,
} from '../setup.js';

const servers: MockBitbucketServer[] = [];

async function startHarness(
  options: Parameters<typeof startMockBitbucket>[0]
): Promise<MockBitbucketServer> {
  const server = await startMockBitbucket(options);
  servers.push(server);
  return server;
}

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

function wireCommand(server: MockBitbucketServer) {
  const credentialStore = createMockCredentialStoreOnly({
    username: 'tester',
    apiToken: 'test-token',
  });
  const output = createMockOutputService();
  const repositoriesApi = buildApiFor(
    server.url,
    credentialStore,
    output,
    RepositoriesApi
  );
  const command = new ListReposCommand(
    repositoriesApi,
    createMockContextService(),
    output
  );
  return { command, output };
}

describe('mock Bitbucket integration (repo list)', () => {
  it('lists repositories end-to-end: paths, params, auth header, rows', async () => {
    const repos = [1, 2, 3].map(makeRepo);
    const server = await startHarness({
      routes: [repositoriesRoute({ repos, baseUrl: '' })],
    });
    const { command, output } = wireCommand(server);

    await command.execute({ workspace: 'workspace' }, { globalOptions: {} });

    // Wire traffic: correct path and query params, auth attached.
    expect(server.requests).toHaveLength(1);
    const request = server.requests[0]!;
    expect(request.method).toBe('GET');
    expect(request.path).toBe('/repositories/workspace');
    expect(request.query.get('page')).toBe('1');
    expect(request.query.get('pagelen')).toBe('25');
    expect(request.headers.authorization?.startsWith('Basic ')).toBe(true);

    // Output rendered all repos (rows land in a separate table-rows log).
    const rowsLog =
      output.logs.find((log) => log.startsWith('table-rows:')) ?? '';
    for (const repo of repos) {
      expect(rowsLog).toContain(repo.slug);
      expect(rowsLog).toContain(repo.is_private ? 'private' : 'public');
    }
  });

  it('walks every page with --all through the real client', async () => {
    const repos = Array.from({ length: 7 }, (_, i) => makeRepo(i + 1));
    const server = await startHarness({
      routes: [repositoriesRoute({ repos, baseUrl: '', maxPagelen: 3 })],
      latencyMs: 5,
    });
    const { command, output } = wireCommand(server);

    await command.execute(
      { workspace: 'workspace', all: true },
      { globalOptions: { json: true } }
    );

    // size=7 with a pagelen cap of 3 → ceil(7/3) = 3 pages requested.
    const pages = server.requests.map((r) => r.query.get('page'));
    expect(pages.sort()).toEqual(['1', '2', '3']);
    for (const request of server.requests) {
      expect(request.query.get('pagelen')).toBe('50');
      expect(request.path).toBe('/repositories/workspace');
    }

    const json = output.logs.find((log) => log.startsWith('json:'));
    expect(json).toBeDefined();
    const payload = JSON.parse(json!.slice('json:'.length)) as {
      count: number;
      repositories: { slug: string }[];
    };
    expect(payload.count).toBe(7);
    expect(payload.repositories.map((r) => r.slug)).toEqual(
      repos.map((r) => r.slug)
    );
  });

  it('fetches remaining --all pages concurrently', async () => {
    const repos = Array.from({ length: 12 }, (_, i) => makeRepo(i + 1));
    const server = await startHarness({
      routes: [repositoriesRoute({ repos, baseUrl: '', maxPagelen: 4 })],
      latencyMs: 15,
    });
    const { command } = wireCommand(server);

    await command.execute(
      { workspace: 'workspace', all: true },
      { globalOptions: {} }
    );

    // 12 repos / 4 per page = 3 pages; page 1 sequential, pages 2-3 in flight
    // together → peak of exactly 2 concurrent requests.
    expect(server.requests).toHaveLength(3);
    expect(server.peakInFlight.value).toBe(2);
  });

  it('falls back to sequential page walks when size is absent', async () => {
    let call = 0;
    const server = await startHarness({
      latencyMs: 5,
      routes: [
        {
          method: 'GET',
          matchPathname: (p) =>
            p === '/repositories/workspace' ||
            p === '/2.0/repositories/workspace',
          respond: () => {
            call += 1;
            const bodies = [
              { values: [makeRepo(1)], next: 'http://x?page=2' },
              { values: [makeRepo(2)], next: 'http://x?page=3' },
              { values: [makeRepo(3)] },
            ];
            // No `size` anywhere → sequential fallback must kick in.
            return { body: bodies[Math.min(call - 1, 2)] };
          },
        },
      ],
    });
    const { command } = wireCommand(server);

    await command.execute(
      { workspace: 'workspace', all: true },
      { globalOptions: {} }
    );

    expect(server.requests).toHaveLength(3);
    expect(server.peakInFlight.value).toBe(1);
  });

  it('retries a 429 with Retry-After and still succeeds', async () => {
    let listCalls = 0;
    const server = await startHarness({
      latencyMs: 0,
      routes: [
        {
          method: 'GET',
          matchPathname: (p) =>
            p === '/repositories/workspace' ||
            p === '/2.0/repositories/workspace',
          respond: () => {
            listCalls += 1;
            if (listCalls === 1) {
              return {
                status: 429,
                body: { error: { message: 'Too many requests' } },
                headers: { 'retry-after': '0' },
              };
            }
            return {
              body: {
                values: [makeRepo(1)],
                size: 1,
                page: 1,
                pagelen: 25,
              },
            };
          },
        },
      ],
    });
    const { command, output } = wireCommand(server);

    await command.execute(
      { workspace: 'workspace' },
      { globalOptions: { json: true } }
    );

    expect(listCalls).toBe(2);
    const warning = output.logs.find((log) => log.startsWith('warning:')) as
      string | undefined;
    expect(warning).toContain('Rate limited');

    const json = output.logs.find((log) => log.startsWith('json:'));
    expect(JSON.parse(json!.slice('json:'.length))).toMatchObject({
      count: 1,
    });
  });

  it('maps Bitbucket 404 bodies to APIError with the extracted message', async () => {
    const server = await startHarness({
      latencyMs: 0,
      routes: [
        {
          method: 'GET',
          matchPathname: (p) =>
            p === '/repositories/workspace' ||
            p === '/2.0/repositories/workspace',
          respond: () => ({
            status: 404,
            body: {
              error: {
                message: "Repository 'workspace' not found",
              },
            },
          }),
        },
      ],
    });
    const { command } = wireCommand(server);

    const error: unknown = await command
      .execute({ workspace: 'workspace' }, { globalOptions: {} })
      .then(
        () => null,
        (caught: unknown) => caught
      );

    // The axios error interceptor must translate the wire 404 into an APIError
    // carrying Bitbucket's own message text.
    expect(error).toBeInstanceOf(APIError);
    expect((error as APIError).message).toBe(
      "Repository 'workspace' not found"
    );
    expect((error as APIError).statusCode).toBe(404);
  });

  it('rejects unauthenticated requests at the fixture boundary', async () => {
    const server = await startHarness({
      latencyMs: 0,
      requireAuth: true,
      routes: [repositoriesRoute({ repos: [makeRepo(1)], baseUrl: '' })],
    });

    // The negative case: a request WITHOUT credentials must fail loudly at
    // the fixture, proving that successful tests above only pass because the
    // axios interceptor attached Basic auth.
    const response = await fetch(`${server.url}/repositories/workspace`);
    expect(response.status).toBe(401);
    expect(server.requests[0]?.headers.authorization).toBeUndefined();
  });
});
