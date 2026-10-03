/**
 * `bb pr checks --watch` and status pagination. A fake sleep advances a tick
 * counter, so each poll sees the next scripted set of statuses.
 */

import { describe, it, expect } from 'bun:test';
import { ChecksPRCommand } from '../../../src/commands/pr/checks.command.js';
import type {
  CommitStatusesApi,
  Commitstatus,
  PullrequestsApi,
} from '../../../src/generated/api.js';
import { BBError, ErrorCode } from '../../../src/types/errors.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../../setup.js';

function check(key: string, state: string): Commitstatus {
  return { type: 'commit_status', key, name: key, state } as Commitstatus;
}

function harness(polls: Commitstatus[][], pagelen = 50) {
  let tick = 0;
  const sleeps: number[] = [];
  const pageRequests: unknown[] = [];
  const api = {
    repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet: async (
      _request: unknown,
      options: { params: { page: number } }
    ) => {
      pageRequests.push(options.params);
      const all = polls[Math.min(tick, polls.length - 1)]!;
      const { page } = options.params;
      const start = (page - 1) * pagelen;
      return {
        data: {
          values: all.slice(start, start + pagelen),
          next:
            start + pagelen < all.length
              ? `https://next?page=${page + 1}`
              : undefined,
        },
      };
    },
  } as unknown as CommitStatusesApi;
  return {
    api,
    sleeps,
    pageRequests,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      tick++;
    },
  };
}

function command(h: ReturnType<typeof harness>) {
  const output = createMockOutputService();
  return {
    output,
    command: new ChecksPRCommand(
      h.api,
      {} as PullrequestsApi,
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      createMockGitService(),
      output,
      h.sleep
    ),
  };
}

async function captureError(promise: Promise<unknown>): Promise<BBError> {
  try {
    await promise;
  } catch (error) {
    return error as BBError;
  }
  throw new Error('expected the command to throw');
}

describe('ChecksPRCommand --watch', () => {
  it('polls until no check is in progress, printing changes', async () => {
    const h = harness([
      [check('build', 'INPROGRESS'), check('lint', 'SUCCESSFUL')],
      [check('build', 'INPROGRESS'), check('lint', 'SUCCESSFUL')],
      [check('build', 'SUCCESSFUL'), check('lint', 'SUCCESSFUL')],
    ]);
    const { command: cmd, output } = command(h);

    await cmd.execute(
      { id: '7', watch: true, interval: '3' },
      { globalOptions: {} }
    );

    expect(h.sleeps).toEqual([3000, 3000]);
    expect(output.logs.slice(0, 2)).toEqual([
      'text:Waiting for 1 of 2 checks on pull request #7...',
      'text:  OK build passed',
    ]);
    expect(output.logs).toContain('table:STATUS,NAME,DESCRIPTION,UPDATED');
  });

  it('throws CI_FAILED after rendering when a check failed or stopped', async () => {
    const h = harness([
      [check('build', 'INPROGRESS'), check('e2e', 'INPROGRESS')],
      [check('build', 'FAILED'), check('e2e', 'STOPPED')],
    ]);
    const { command: cmd, output } = command(h);

    const error = await captureError(
      cmd.execute({ id: '7', watch: true }, { globalOptions: {} })
    );

    expect(error).toBeInstanceOf(BBError);
    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(error.message).toBe(
      '2 checks did not pass on pull request #7: build, e2e.'
    );
    expect(output.logs).toContain('table:STATUS,NAME,DESCRIPTION,UPDATED');
    expect(h.sleeps).toEqual([10000]);
  });

  it('prints only the final JSON envelope, then fails', async () => {
    const h = harness([
      [check('build', 'INPROGRESS')],
      [check('build', 'FAILED')],
    ]);
    const { command: cmd, output } = command(h);

    const error = await captureError(
      cmd.execute({ id: '7', watch: true }, { globalOptions: { json: true } })
    );

    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(output.logs).toHaveLength(1);
    const payload = JSON.parse(output.logs[0]!.slice('json:'.length));
    expect(payload.summary).toEqual({ successful: 0, failed: 1, pending: 0 });
  });

  it('returns at once when nothing is pending', async () => {
    const h = harness([[check('build', 'SUCCESSFUL')]]);
    const { command: cmd, output } = command(h);

    await cmd.execute({ id: '7', watch: true }, { globalOptions: {} });

    expect(h.sleeps).toEqual([]);
    expect(output.logs[0]).toBe('text:');
  });

  it('waits for the first check to be reported', async () => {
    const h = harness([
      [],
      [check('build', 'INPROGRESS')],
      [check('build', 'SUCCESSFUL')],
    ]);
    const { command: cmd, output } = command(h);

    await cmd.execute({ id: '7', watch: true }, { globalOptions: {} });

    expect(h.sleeps).toHaveLength(2);
    expect(output.logs.slice(0, 3)).toEqual([
      'text:Waiting for checks to be reported on pull request #7...',
      'text:  RUN build running',
      'text:  OK build passed',
    ]);
  });

  it('fails when no check is reported within the grace polls', async () => {
    const h = harness([[]]);
    const { command: cmd } = command(h);

    const error = await captureError(
      cmd.execute({ id: '7', watch: true }, { globalOptions: {} })
    );

    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(error.message).toBe('No checks were reported on pull request #7.');
    expect(h.sleeps).toHaveLength(3);
  });

  it('keeps the exit status of plain `pr checks` unaffected by failures', async () => {
    const h = harness([[check('build', 'FAILED')]]);
    const { command: cmd } = command(h);

    await cmd.execute({ id: '7' }, { globalOptions: {} });
  });
});

describe('ChecksPRCommand pagination', () => {
  it('reads every status page, so a pending check on page 2 keeps it waiting', async () => {
    const h = harness(
      [
        [check('a', 'SUCCESSFUL'), check('b', 'INPROGRESS')],
        [check('a', 'SUCCESSFUL'), check('b', 'SUCCESSFUL')],
      ],
      1
    );
    const { command: cmd } = command(h);

    await cmd.execute({ id: '7', watch: true }, { globalOptions: {} });

    expect(h.sleeps).toHaveLength(1);
    expect(h.pageRequests).toHaveLength(4);
  });
});
