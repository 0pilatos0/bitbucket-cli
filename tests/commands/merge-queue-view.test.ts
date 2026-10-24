/**
 * bb merge-queue view command tests
 */

import { afterAll, describe, it, expect } from 'bun:test';
import { ViewMergeQueueCommand } from '../../src/commands/merge-queue/view.command.js';
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
  state: 'PAUSED',
};

const queueRoute: MockRoute = {
  matchPathname: (pathname) =>
    decodeURIComponent(pathname).endsWith(
      '/repositories/acme/demo/merge-queues/{queue-1}'
    ),
  respond: () => ({ body: queue }),
};

function createCommand(
  api: MergeQueuesApi,
  output: ConstructorParameters<typeof ViewMergeQueueCommand>[2]
) {
  return new ViewMergeQueueCommand(
    api,
    createMockContextService({ workspace: 'acme', repoSlug: 'demo' }),
    output
  );
}

describe('ViewMergeQueueCommand', () => {
  it('wraps a bare UUID in braces and emits the JSON result', async () => {
    const { server, output, api } = await startHarness([queueRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: 'queue-1' },
      { globalOptions: { json: true } }
    );

    expect(decodeURIComponent(server.requests[0]!.path)).toEndWith(
      '/merge-queues/{queue-1}'
    );
    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'acme',
      repoSlug: 'demo',
      mergeQueue: queue,
    });
  });

  it('prints name, state and UUID', async () => {
    const { output, api } = await startHarness([queueRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: '{queue-1}' },
      { globalOptions: {} }
    );

    const printed = output.logs.join('\n');
    expect(printed).toContain('main');
    expect(printed).toContain('[PAUSED]');
    expect(printed).toContain('{queue-1}');
  });

  it('names the queue when it does not exist', async () => {
    const { output, api } = await startHarness([]);

    await expect(
      createCommand(api(MergeQueuesApi), output).execute(
        { uuid: 'missing' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Merge queue {missing} not found in acme/demo.');
  });
});
