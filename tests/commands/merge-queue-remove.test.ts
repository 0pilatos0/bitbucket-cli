/**
 * bb merge-queue remove command tests
 */

import { afterAll, describe, it, expect } from 'bun:test';
import { RemoveMergeQueuePullRequestCommand } from '../../src/commands/merge-queue/remove.command.js';
import { MergeQueuesApi } from '../../src/generated/api.js';
import { ErrorCode } from '../../src/types/errors.js';
import {
  startCommandHarness,
  type MockBitbucketServer,
  type MockRoute,
} from '../helpers/mock-bitbucket.js';
import { getJsonPayload } from '../helpers/output-logs.js';
import { createMockContextService, createMockPromptService } from '../setup.js';

const servers: MockBitbucketServer[] = [];

afterAll(async () => {
  await Promise.all(servers.map((server) => server.stop()));
});

async function startHarness(routes: MockRoute[]) {
  const harness = await startCommandHarness(routes);
  servers.push(harness.server);
  return harness;
}

const removeRoute: MockRoute = {
  method: 'DELETE',
  matchPathname: (pathname) =>
    decodeURIComponent(pathname).endsWith(
      '/repositories/acme/demo/merge-queues/{queue-1}/queue/42'
    ),
  respond: () => ({ status: 202 }),
};

function createCommand(
  api: MergeQueuesApi,
  output: ConstructorParameters<typeof RemoveMergeQueuePullRequestCommand>[2]
) {
  return new RemoveMergeQueuePullRequestCommand(
    api,
    createMockContextService({ workspace: 'acme', repoSlug: 'demo' }),
    output
  );
}

describe('RemoveMergeQueuePullRequestCommand', () => {
  it('requires --yes and does not call the API without it', async () => {
    const { server, output, api } = await startHarness([removeRoute]);

    await expect(
      createCommand(api(MergeQueuesApi), output).execute(
        { uuid: 'queue-1', prId: '42' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Use --yes to confirm.');
    expect(server.requests).toEqual([]);
  });

  it('asks for confirmation in an interactive terminal', async () => {
    const { server, output, api } = await startHarness([removeRoute]);
    const prompt = createMockPromptService([true]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: 'queue-1', prId: '42' },
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual([
      'confirm:This will remove PR #42 from merge queue {queue-1} in acme/demo. Continue?',
    ]);
    expect(server.requests).toHaveLength(1);
  });

  it('rejects an invalid PR id before calling the API', async () => {
    const { server, output, api } = await startHarness([removeRoute]);

    await expect(
      createCommand(api(MergeQueuesApi), output).execute(
        { uuid: 'queue-1', prId: '4x', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
    expect(server.requests).toEqual([]);
  });

  it('removes the pull request with --yes', async () => {
    const { server, output, api } = await startHarness([removeRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: 'queue-1', prId: '42', yes: true },
      { globalOptions: {} }
    );

    expect(server.requests[0]!.method).toBe('DELETE');
    expect(output.logs).toContain(
      'success:Requested removal of PR #42 from merge queue {queue-1}'
    );
  });

  it('emits the JSON result', async () => {
    const { output, api } = await startHarness([removeRoute]);

    await createCommand(api(MergeQueuesApi), output).execute(
      { uuid: '{queue-1}', prId: '42', yes: true },
      { globalOptions: { json: true } }
    );

    expect(getJsonPayload(output.logs)).toEqual({
      success: true,
      workspace: 'acme',
      repoSlug: 'demo',
      mergeQueueUuid: '{queue-1}',
      pullRequestId: 42,
    });
  });

  it('names the pull request when it is not in the queue', async () => {
    const { output, api } = await startHarness([]);

    await expect(
      createCommand(api(MergeQueuesApi), output).execute(
        { uuid: 'queue-1', prId: '7', yes: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('PR #7 not found in merge queue {queue-1} in acme/demo.');
  });
});
