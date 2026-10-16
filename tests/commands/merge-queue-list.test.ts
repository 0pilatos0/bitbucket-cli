/**
 * bb merge-queue list command tests
 */

import { afterAll, describe, it, expect } from 'bun:test';
import { ListMergeQueuesCommand } from '../../src/commands/merge-queue/list.command.js';
import { MergeQueuesApi } from '../../src/generated/api.js';
import {
  startCommandHarness,
  type MockBitbucketServer,
  type MockRoute,
} from '../helpers/mock-bitbucket.js';
import { getJsonPayload } from '../helpers/output-logs.js';
import { createMockContextService } from '../setup.js';

const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

async function startHarness(routes: MockRoute[]) {
  const harness = await startCommandHarness(routes);
  servers.push(harness.server);
  return harness;
}

const queue = {
  type: 'merge_queue',
  uuid: '{queue-1}',
  name: 'main',
  state: 'ACTIVE',
};

describe('ListMergeQueuesCommand', () => {
  it('emits the JSON envelope with the paging params sent', async () => {
    const { server, output, api } = await startHarness([
      {
        matchPathname: (pathname) =>
          pathname.endsWith('/repositories/acme/demo/merge-queues'),
        respond: () => ({ body: { values: [queue] } }),
      },
    ]);
    const command = new ListMergeQueuesCommand(
      api(MergeQueuesApi),
      createMockContextService({ workspace: 'acme', repoSlug: 'demo' }),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    expect(server.requests[0]!.query.get('pagelen')).toBe('25');
    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'acme',
      repoSlug: 'demo',
      count: 1,
      hasMore: false,
      limit: 25,
      mergeQueues: [queue],
    });
  });

  it('prints name, state and UUID in a table', async () => {
    const { output, api } = await startHarness([
      {
        matchPathname: (pathname) => pathname.endsWith('/merge-queues'),
        respond: () => ({ body: { values: [queue] } }),
      },
    ]);
    const command = new ListMergeQueuesCommand(
      api(MergeQueuesApi),
      createMockContextService({ workspace: 'acme', repoSlug: 'demo' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    const printed = output.logs.join('\n');
    expect(printed).toContain('main');
    expect(printed).toContain('ACTIVE');
    expect(printed).toContain('{queue-1}');
  });
});
