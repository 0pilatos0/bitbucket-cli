/**
 * Integration tests for the branch-restriction, ssh-key and deployment
 * groups: real generated clients against the local mock Bitbucket server, so
 * endpoint paths, `{uuid}` path encoding and filter query params are checked
 * on the wire rather than against stubs.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import {
  BranchRestrictionsApi,
  DeploymentsApi,
  SSHApi,
  UsersApi,
} from '../../src/generated/api.js';
import { ListBranchRestrictionsCommand } from '../../src/commands/branch-restriction/list.command.js';
import { DeleteSshKeyCommand } from '../../src/commands/ssh-key/delete.command.js';
import { ListDeploymentsCommand } from '../../src/commands/deployment/list.command.js';
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

const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

async function startHarness(routes: MockRoute[]) {
  const server = await startMockBitbucket({ routes, latencyMs: 0 });
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

const endsWith =
  (suffix: string) =>
  (pathname: string): boolean =>
    pathname.endsWith(suffix);

const repoContext = () =>
  createMockContextService({ workspace: 'acme', repoSlug: 'app' });

describe('mock Bitbucket integration (admin command groups)', () => {
  it('sends branch-restriction filters as query params', async () => {
    const { server, output, build } = await startHarness([
      {
        matchPathname: endsWith('/repositories/acme/app/branch-restrictions'),
        respond: () => ({
          body: {
            values: [
              {
                type: 'branchrestriction',
                id: 1,
                kind: 'push',
                branch_match_kind: 'glob',
                pattern: 'main',
              },
            ],
          },
        }),
      },
    ]);
    const command = new ListBranchRestrictionsCommand(
      build(BranchRestrictionsApi),
      repoContext(),
      output
    );

    await command.execute(
      { kind: 'push', pattern: 'main' },
      { globalOptions: {} }
    );

    const request = server.requests[0]!;
    expect(request.query.get('kind')).toBe('push');
    expect(request.query.get('pattern')).toBe('main');
    expect(request.query.get('pagelen')).toBe('25');
  });

  it('resolves the account then deletes the key by its encoded {uuid}', async () => {
    const { server, output, build } = await startHarness([
      {
        matchPathname: endsWith('/user'),
        respond: () => ({ body: { type: 'user', uuid: '{me}' } }),
      },
      {
        method: 'DELETE',
        matchPathname: (pathname) => pathname.includes('/ssh-keys/'),
        respond: () => ({ status: 204 }),
      },
    ]);
    const command = new DeleteSshKeyCommand(
      build(SSHApi),
      build(UsersApi),
      output
    );

    await command.execute(
      { keyId: '{key-1}', yes: true },
      { globalOptions: {} }
    );

    expect(server.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /user',
      'DELETE /users/%7Bme%7D/ssh-keys/%7Bkey-1%7D',
    ]);
    expect(output.logs).toContain('success:Deleted SSH key {key-1}');
  });

  it('lists deployments with environment names from the environments endpoint', async () => {
    const { server, output, build } = await startHarness([
      {
        matchPathname: endsWith('/repositories/acme/app/environments'),
        respond: () => ({
          body: {
            values: [
              {
                type: 'deployment_environment',
                uuid: '{env}',
                name: 'Staging',
              },
            ],
          },
        }),
      },
      {
        matchPathname: endsWith('/repositories/acme/app/deployments'),
        respond: () => ({
          body: {
            values: [
              {
                type: 'deployment',
                uuid: '{dep}',
                environment: { type: 'deployment_environment', uuid: '{env}' },
                state: {
                  type: 'deployment_state_in_progress',
                  name: 'IN_PROGRESS',
                },
              },
            ],
          },
        }),
      },
    ]);
    const command = new ListDeploymentsCommand(
      build(DeploymentsApi),
      repoContext(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(server.requests.map((r) => r.path)).toEqual([
      '/repositories/acme/app/environments',
      '/repositories/acme/app/deployments',
    ]);
    const rowsLog = output.logs.find((log) => log.startsWith('table-rows:'));
    expect(rowsLog).toContain('Staging');
    expect(rowsLog).toContain('IN_PROGRESS');
  });
});
