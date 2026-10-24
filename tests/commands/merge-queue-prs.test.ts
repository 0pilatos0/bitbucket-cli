/**
 * bb merge-queue prs command tests
 */

import { afterAll, describe, it, expect } from 'bun:test';
import { ListMergeQueuePullRequestsCommand } from '../../src/commands/merge-queue/prs.command.js';
import { MergeQueuesApi } from '../../src/generated/api.js';
import {
  startCommandHarness,
  type MockBitbucketServer,
  type MockRoute,
} from '../helpers/mock-bitbucket.js';
import { getJsonPayload, getTableRows } from '../helpers/output-logs.js';
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

const entry = {
  type: 'queued_pullrequest',
  status: 'QUEUED',
  rank: 1,
  queued_on: '2026-10-20T10:00:00.000000+00:00',
  merge_queue: { type: 'merge_queue', uuid: '{queue-1}' },
  pullrequest: { type: 'pullrequest', id: 42, title: 'Add widgets' },
};

const queueRoute: MockRoute = {
  matchPathname: (pathname) =>
    decodeURIComponent(pathname).endsWith(
      '/repositories/acme/demo/merge-queues/{queue-1}/queue'
    ),
  respond: () => ({ body: { values: [entry] } }),
};

function createCommand(
  api: MergeQueuesApi,
  output: ConstructorParameters<typeof ListMergeQueuePullRequestsCommand>[2]
) {
  return new ListMergeQueuePullRequestsCommand(
    api,
    createMockContextService({ workspace: 'acme', repoSlug: 'demo' }),
    output
  );
}

describe('ListMergeQueuePullRequestsCommand', () => {
  it('emits the JSON envelope with the paging params sent', async () => {
    const { server, output, api } = await startHarness([queueRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: 'queue-1' },
      { globalOptions: { json: true } }
    );

    expect(server.requests[0]!.query.get('pagelen')).toBe('25');
    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'acme',
      repoSlug: 'demo',
      mergeQueueUuid: '{queue-1}',
      count: 1,
      hasMore: false,
      limit: 25,
      queuedPullRequests: [entry],
    });
  });

  it('prints rank, PR, title and status in a table', async () => {
    const { output, api } = await startHarness([queueRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: '{queue-1}' },
      { globalOptions: {} }
    );

    const [row] = getTableRows(output.logs);
    expect(row!.slice(0, 4)).toEqual(['1', '#42', 'Add widgets', 'QUEUED']);
  });

  it('reports an empty queue', async () => {
    const { output, api } = await startHarness([
      { ...queueRoute, respond: () => ({ body: { values: [] } }) },
    ]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: 'queue-1' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain('info:No pull requests in this merge queue');
  });
});
