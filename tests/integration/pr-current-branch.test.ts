/**
 * Integration test for inferring the pull request from the current branch:
 * the real generated client against the local mock Bitbucket server, so the
 * BBQL filter is checked on the wire rather than against a stub.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import { PullrequestsApi } from '../../src/generated/api.js';
import { ApprovePRCommand } from '../../src/commands/pr/approve.command.js';
import {
  buildApiFor,
  startMockBitbucket,
  type MockBitbucketServer,
} from '../helpers/mock-bitbucket.js';
import {
  createMockContextService,
  createMockCredentialStoreOnly,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';

const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

describe('mock Bitbucket integration (pr current-branch inference)', () => {
  it('finds the PR with a server-side source branch filter', async () => {
    const server = await startMockBitbucket({
      latencyMs: 0,
      routes: [
        {
          method: 'GET',
          matchPathname: (pathname) =>
            pathname.endsWith('/repositories/acme/app/pullrequests'),
          respond: () => ({
            body: {
              values: [{ id: 42, source: { branch: { name: 'feat/login' } } }],
            },
          }),
        },
        {
          method: 'POST',
          matchPathname: (pathname) =>
            pathname.endsWith('/repositories/acme/app/pullrequests/42/approve'),
          respond: () => ({ body: { approved: true } }),
        },
      ],
    });
    servers.push(server);
    const output = createMockOutputService();
    const pullrequestsApi = buildApiFor(
      server.url,
      createMockCredentialStoreOnly({
        username: 'tester',
        apiToken: 'test-token',
      }),
      output,
      PullrequestsApi
    );

    await new ApprovePRCommand(
      pullrequestsApi,
      createMockContextService({ workspace: 'acme', repoSlug: 'app' }),
      createMockGitService({ currentBranch: 'feat/login' }),
      output
    ).execute({}, { globalOptions: {} });

    const [list, approve] = server.requests;
    expect(server.requests).toHaveLength(2);
    expect(list?.method).toBe('GET');
    expect(list?.query.get('state')).toBe('OPEN');
    expect(list?.query.get('q')).toBe('source.branch.name = "feat/login"');
    expect(list?.query.get('page')).toBeNull();
    expect(approve?.path).toEndWith('/pullrequests/42/approve');
    expect(output.logs.join('\n')).toContain('Approved pull request #42');
  });
});
