/**
 * Integration tests for the gh-style PR workflow: `pr list` filters, `pr
 * status`, `pr unapprove` and `pr request-changes`, driven through the real
 * generated clients so the BBQL `q` parameter and endpoints are checked on
 * the wire.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import {
  PullrequestsApi,
  UsersApi,
  WorkspacesApi,
} from '../../src/generated/api.js';
import { UserResolverService } from '../../src/services/user-resolver.service.js';
import { ListPRsCommand } from '../../src/commands/pr/list.command.js';
import { StatusPRCommand } from '../../src/commands/pr/status.command.js';
import { UnapprovePRCommand } from '../../src/commands/pr/unapprove.command.js';
import { RequestChangesPRCommand } from '../../src/commands/pr/request-changes.command.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';
import {
  buildApiFor,
  startMockBitbucket,
  type MockBitbucketServer,
  type MockRoute,
} from '../helpers/mock-bitbucket.js';
import {
  createMockContextService,
  createMockCredentialStoreOnly,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';

const ME = '{me-uuid}';
const ALICE = '{alice-uuid}';

const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

function pr(id: number, title: string, branch: string) {
  return {
    type: 'pullrequest',
    id,
    title,
    state: 'OPEN',
    draft: false,
    author: { display_name: 'Me', uuid: ME },
    source: { branch: { name: branch } },
    destination: { branch: { name: 'main' } },
  };
}

const userRoutes: MockRoute[] = [
  {
    method: 'GET',
    matchPathname: (pathname) => pathname.endsWith('/user'),
    respond: () => ({ body: { type: 'user', uuid: ME } }),
  },
  {
    method: 'GET',
    matchPathname: (pathname) => pathname.endsWith('/workspaces/acme/members'),
    respond: () => ({
      body: {
        values: [
          {
            type: 'workspace_membership',
            user: { type: 'user', uuid: ALICE, nickname: 'alice' },
          },
        ],
      },
    }),
  },
];

/** Serves `/pullrequests`, choosing the PRs from the request's `q`. */
function pullRequestsRoute(
  byQuery: (q: string | null) => ReturnType<typeof pr>[]
): MockRoute {
  return {
    method: 'GET',
    matchPathname: (pathname) =>
      pathname.endsWith('/repositories/acme/app/pullrequests'),
    respond: ({ query }) => ({
      body: { values: byQuery(query.get('q')), pagelen: 25, page: 1 },
    }),
  };
}

async function startHarness(routes: MockRoute[]) {
  const server = await startMockBitbucket({
    routes: [...userRoutes, ...routes],
    latencyMs: 0,
  });
  servers.push(server);
  const credentialStore = createMockCredentialStoreOnly({
    username: 'tester',
    apiToken: 'test-token',
  });
  const output = createMockOutputService();
  const build = <T>(ApiClass: Parameters<typeof buildApiFor<T>>[3]): T =>
    buildApiFor(server.url, credentialStore, output, ApiClass);
  return { server, output, build };
}

const repoContext = () =>
  createMockContextService({ workspace: 'acme', repoSlug: 'app' });

const listQueries = (server: MockBitbucketServer) =>
  server.requests
    .filter((request) => request.path.endsWith('/pullrequests'))
    .map((request) => request.query.get('q'));

describe('pr list filters', () => {
  it('ANDs every filter into one BBQL query, resolving users (incl. nicknames) to UUIDs', async () => {
    const { server, output, build } = await startHarness([
      pullRequestsRoute(() => [pr(7, 'Add login', 'feature/login')]),
    ]);
    const command = new ListPRsCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      output
    );

    await command.execute(
      {
        author: '@me',
        reviewer: 'alice',
        source: 'feature/login',
        destination: 'main',
        query: 'title ~ "login" OR title ~ "auth"',
      },
      { globalOptions: {} }
    );

    expect(listQueries(server)).toEqual([
      `author.uuid="${ME}" AND reviewers.uuid="${ALICE}" AND ` +
        'source.branch.name="feature/login" AND ' +
        'destination.branch.name="main" AND ' +
        '(title ~ "login" OR title ~ "auth")',
    ]);
    expect(
      server.requests
        .find((r) => r.path.endsWith('/pullrequests'))
        ?.query.get('state')
    ).toBe('OPEN');
  });

  it('escapes quotes and backslashes in branch names', async () => {
    const { server, output, build } = await startHarness([
      pullRequestsRoute(() => []),
    ]);
    const command = new ListPRsCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      output
    );

    await command.execute({ source: 'we"ird\\branch' }, { globalOptions: {} });

    expect(listQueries(server)).toEqual([
      'source.branch.name="we\\"ird\\\\branch"',
    ]);
    expect(output.logs).toContain(
      'info:No open pull requests match the filters'
    );
  });

  it('keeps --mine as --reviewer @me and reports the filters in JSON', async () => {
    const { server, output, build } = await startHarness([
      pullRequestsRoute(() => []),
    ]);
    const command = new ListPRsCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      output
    );

    await command.execute({ mine: true }, { globalOptions: { json: true } });

    expect(listQueries(server)).toEqual([`reviewers.uuid="${ME}"`]);
    const json = JSON.parse(output.logs[0]!.replace(/^json:/, '')) as {
      filters: Record<string, unknown>;
    };
    expect(json.filters).toEqual({
      mine: true,
      author: null,
      reviewer: '@me',
      source: null,
      destination: null,
      query: null,
    });
  });

  it('rejects --mine combined with a different --reviewer before any request', async () => {
    const { server, output, build } = await startHarness([]);
    const command = new ListPRsCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      output
    );

    const error = await command
      .execute(
        { mine: true, reviewer: 'alice-account-id' },
        { globalOptions: {} }
      )
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(server.requests).toHaveLength(0);
  });
});

describe('pr status', () => {
  const BRANCH_QUERY =
    'source.branch.name="feature/login" AND ' +
    'source.repository.full_name="acme/app"';
  const routes = [
    pullRequestsRoute((q) => {
      if (q === BRANCH_QUERY) {
        return [pr(7, 'Add login', 'feature/login')];
      }
      if (q === `author.uuid="${ME}"`) {
        return [pr(7, 'Add login', 'feature/login'), pr(5, 'Docs', 'docs')];
      }
      return [];
    }),
  ];

  it('shows the current branch PR, your PRs and review requests', async () => {
    const { server, output, build } = await startHarness(routes);
    const command = new StatusPRCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      createMockGitService({ currentBranch: 'feature/login' }),
      output
    );

    await command.execute({}, { globalOptions: { noTruncate: true } });

    expect(listQueries(server).sort()).toEqual([
      `author.uuid="${ME}"`,
      `reviewers.uuid="${ME}"`,
      BRANCH_QUERY,
    ]);
    const text = output.logs.join('\n');
    expect(text).toContain('Current branch\ntext:  #7  Add login');
    expect(text).toContain('Created by you\ntext:  #7  Add login');
    expect(text).toContain('#5  Docs');
    expect(text).toContain('No open pull requests are requesting your review');
  });

  it('skips the current-branch lookup when --repo targets another repository', async () => {
    const { server, output, build } = await startHarness(routes);
    const command = new StatusPRCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      createMockContextService({ workspace: 'other', repoSlug: 'clone' }),
      createMockGitService({ currentBranch: 'feature/login' }),
      output
    );

    await command.execute(
      { workspace: 'acme', repo: 'app' },
      { globalOptions: { json: true } }
    );

    expect(listQueries(server)).not.toContain(BRANCH_QUERY);
    const json = JSON.parse(output.logs[0]!.replace(/^json:/, '')) as Record<
      string,
      unknown
    >;
    expect(json.currentBranch).toBeNull();
    expect(json.currentBranchPullRequest).toBeNull();
    expect((json.createdByYou as unknown[]).length).toBe(2);
    expect(json.reviewRequested).toEqual([]);
  });

  it('treats a branch without commits as no current branch', async () => {
    const { server, output, build } = await startHarness(routes);
    const command = new StatusPRCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      createMockGitService({ throwOnGetCurrentBranch: true }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(listQueries(server)).toHaveLength(2);
    expect(output.logs.join('\n')).toContain(
      'Not on a branch of this repository'
    );
  });

  it('treats a detached HEAD as no current branch', async () => {
    const { server, output, build } = await startHarness(routes);
    const command = new StatusPRCommand(
      build(PullrequestsApi),
      new UserResolverService(build(UsersApi), build(WorkspacesApi)),
      repoContext(),
      createMockGitService({ currentBranch: 'HEAD' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(listQueries(server)).toHaveLength(2);
    expect(output.logs.join('\n')).toContain(
      'Not on a branch of this repository'
    );
  });
});

describe('pr review actions', () => {
  const reviewRoutes: MockRoute[] = [
    {
      method: 'DELETE',
      matchPathname: (pathname) => pathname.endsWith('/pullrequests/7/approve'),
      respond: () => ({ status: 204 }),
    },
    {
      method: 'POST',
      matchPathname: (pathname) =>
        pathname.endsWith('/pullrequests/7/request-changes'),
      respond: () => ({
        body: { type: 'participant', state: 'changes_requested' },
      }),
    },
    {
      method: 'DELETE',
      matchPathname: (pathname) =>
        pathname.endsWith('/pullrequests/7/request-changes'),
      respond: () => ({ status: 204 }),
    },
  ];

  it('unapprove sends DELETE to the approve endpoint', async () => {
    const { server, output, build } = await startHarness(reviewRoutes);
    const command = new UnapprovePRCommand(
      build(PullrequestsApi),
      repoContext(),
      output
    );

    await command.execute({ id: '7' }, { globalOptions: {} });

    expect(server.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'DELETE /repositories/acme/app/pullrequests/7/approve',
    ]);
    expect(output.logs).toContain(
      'success:Withdrew approval of pull request #7'
    );
  });

  it('request-changes POSTs, and --undo DELETEs', async () => {
    const { server, output, build } = await startHarness(reviewRoutes);
    const command = new RequestChangesPRCommand(
      build(PullrequestsApi),
      repoContext(),
      output
    );

    await command.execute({ id: '7' }, { globalOptions: {} });
    await command.execute(
      { id: '7', undo: true },
      { globalOptions: { json: true } }
    );

    expect(server.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'POST /repositories/acme/app/pullrequests/7/request-changes',
      'DELETE /repositories/acme/app/pullrequests/7/request-changes',
    ]);
    expect(output.logs[0]).toBe('success:Requested changes on pull request #7');
    expect(JSON.parse(output.logs[1]!.replace(/^json:/, ''))).toEqual({
      success: true,
      pullRequestId: 7,
      changesRequested: false,
    });
  });
});
