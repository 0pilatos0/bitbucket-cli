/**
 * Tests for following CI: `pipeline watch`, `pipeline logs --follow`, and the
 * latest-run default for `pipeline view` / `logs`. A fake sleep advances a
 * tick counter, so each poll sees the next scripted API state.
 */

import { describe, it, expect } from 'bun:test';
import { ViewPipelineCommand } from '../../src/commands/pipeline/view.command.js';
import { LogsPipelineCommand } from '../../src/commands/pipeline/logs.command.js';
import { WatchPipelineCommand } from '../../src/commands/pipeline/watch.command.js';
import type { PipelinesApi } from '../../src/generated/api.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';

const PENDING = { name: 'PENDING' };
const RUNNING = { name: 'IN_PROGRESS', stage: { name: 'RUNNING' } };
const PAUSED = { name: 'IN_PROGRESS', stage: { name: 'PAUSED' } };
const PASSED = { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } };
const FAILED = { name: 'COMPLETED', result: { name: 'FAILED' } };

const STEP_PENDING = { name: 'PENDING' };
const STEP_RUNNING = { name: 'IN_PROGRESS' };
const STEP_PASSED = { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } };
const STEP_FAILED = { name: 'COMPLETED', result: { name: 'FAILED' } };

interface Script {
  /** Pipeline state per tick; the last entry repeats. */
  pipeline: unknown[];
  /** Step list per tick; the last entry repeats. */
  steps?: { uuid: string; name: string; state: unknown }[][];
  /** Full log text per step per tick; a missing entry answers 404. */
  logs?: Record<string, (string | Uint8Array | undefined)[]>;
  /** Answer 200 with the whole log even when a Range was sent. */
  ignoreRange?: boolean;
  latest?: { build_number?: number; uuid?: string }[];
}

interface Harness {
  api: PipelinesApi;
  sleep: (ms: number) => Promise<void>;
  sleeps: number[];
  ranges: (string | undefined)[];
  listRequests: { request: unknown; options: unknown }[];
}

function at<T>(entries: T[], tick: number): T {
  return entries[Math.min(tick, entries.length - 1)]!;
}

function harness(script: Script): Harness {
  let tick = 0;
  const sleeps: number[] = [];
  const ranges: (string | undefined)[] = [];
  const listRequests: { request: unknown; options: unknown }[] = [];

  const api = {
    getPipelinesForRepository: async (request: unknown, options: unknown) => {
      listRequests.push({ request, options });
      return { data: { values: script.latest ?? [] } };
    },
    getPipelineForRepository: async () => ({
      data: {
        uuid: '{pipeline-uuid}',
        build_number: 42,
        target: { ref_name: 'main' },
        build_seconds_used: 65,
        state: at(script.pipeline, tick),
      },
    }),
    getPipelineStepsForRepository: async () => ({
      data: { values: at(script.steps ?? [[]], tick) },
    }),
    getPipelineStepLogForRepository: async (
      request: { stepUuid: string },
      options: { headers?: { Range?: string } }
    ) => {
      const range = options.headers?.Range;
      ranges.push(range);
      const log = at(script.logs?.[request.stepUuid] ?? [undefined], tick);
      if (log === undefined) {
        throw new APIError('Not found', 404);
      }
      const bytes =
        typeof log === 'string' ? new TextEncoder().encode(log) : log;
      const offset = range ? Number(/bytes=(\d+)-/.exec(range)![1]) : 0;
      if (!range || script.ignoreRange) {
        return { status: 200, data: bytes.buffer };
      }
      if (offset >= bytes.length) {
        throw new APIError('Range not satisfiable', 416);
      }
      return { status: 206, data: bytes.slice(offset).buffer };
    },
  } as unknown as PipelinesApi;

  return {
    api,
    sleeps,
    ranges,
    listRequests,
    sleep: async (ms) => {
      sleeps.push(ms);
      tick++;
    },
  };
}

const repoContext = () =>
  createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });

function rawOutput(logs: string[]): string {
  return logs
    .filter((log) => log.startsWith('raw:'))
    .map((log) => log.slice('raw:'.length))
    .join('');
}

async function captureError(promise: Promise<unknown>): Promise<BBError> {
  try {
    await promise;
  } catch (error) {
    return error as BBError;
  }
  throw new Error('expected the command to throw');
}

describe('WatchPipelineCommand', () => {
  it('polls until the run completes and prints step transitions', async () => {
    const h = harness({
      pipeline: [PENDING, RUNNING, PASSED],
      steps: [
        [{ uuid: '{s1}', name: 'Build', state: STEP_PENDING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }],
      ],
    });
    const output = createMockOutputService();
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService(),
      output,
      h.sleep
    );

    await command.execute({ id: '42', interval: '5' }, { globalOptions: {} });

    expect(h.sleeps).toEqual([5000, 5000]);
    expect(output.logs).toEqual([
      'text:Watching pipeline #42 on main',
      'text:  1. Build: PENDING',
      'text:  1. Build: IN_PROGRESS',
      'text:  1. Build: SUCCESSFUL',
      'success:Pipeline #42 SUCCESSFUL in 1m 5s',
    ]);
  });

  it('throws CI_FAILED when the run does not pass', async () => {
    const h = harness({
      pipeline: [RUNNING, FAILED],
      steps: [[{ uuid: '{s1}', name: 'Test', state: STEP_FAILED }]],
    });
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService(),
      createMockOutputService(),
      h.sleep
    );

    const error = await captureError(
      command.execute({ id: '42' }, { globalOptions: {} })
    );

    expect(error).toBeInstanceOf(BBError);
    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(error.message).toBe('Pipeline #42 finished with status FAILED.');
    expect(h.sleeps).toEqual([10000]);
  });

  it('emits only the final state in JSON mode, then fails', async () => {
    const h = harness({ pipeline: [RUNNING, RUNNING, FAILED] });
    const output = createMockOutputService();
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService(),
      output,
      h.sleep
    );

    const error = await captureError(
      command.execute({ id: '42' }, { globalOptions: { json: true } })
    );

    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(output.logs).toHaveLength(1);
    const payload = JSON.parse(output.logs[0]!.slice('json:'.length));
    expect(payload.pipeline.state).toEqual(FAILED);
    expect(payload.steps).toEqual([]);
  });

  it('stops with CI_FAILED when the run pauses for a manual step', async () => {
    const h = harness({ pipeline: [RUNNING, PAUSED] });
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService(),
      createMockOutputService(),
      h.sleep
    );

    const error = await captureError(
      command.execute({ id: '42' }, { globalOptions: {} })
    );

    expect(error.code).toBe(ErrorCode.CI_FAILED);
    expect(error.message).toBe(
      'Pipeline #42 is paused, waiting for a manual step.'
    );
    expect(h.sleeps).toHaveLength(1);
  });

  it('rejects a non-positive --interval before calling the API', async () => {
    const h = harness({ pipeline: [PASSED] });
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService(),
      createMockOutputService(),
      h.sleep
    );

    const error = await captureError(
      command.execute({ id: '42', interval: '0' }, { globalOptions: {} })
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(error.message).toContain('--interval must be a positive integer');
  });
});

describe('latest pipeline on the current branch', () => {
  it('views the newest run of the current branch when no id is given', async () => {
    const h = harness({ pipeline: [PASSED], latest: [{ build_number: 7 }] });
    const output = createMockOutputService();
    const command = new ViewPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService({ currentBranch: 'feature/x' }),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    expect(h.listRequests).toEqual([
      {
        request: {
          workspace: 'workspace',
          repoSlug: 'repo',
          targetBranch: 'feature/x',
        },
        options: { params: { page: 1, pagelen: 1, sort: '-created_on' } },
      },
    ]);
  });

  it('asks for an id on a detached HEAD', async () => {
    const h = harness({ pipeline: [PASSED] });
    const command = new WatchPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService({ currentBranch: 'HEAD' }),
      createMockOutputService(),
      h.sleep
    );

    const error = await captureError(
      command.execute({}, { globalOptions: {} })
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_REQUIRED);
    expect(h.listRequests).toHaveLength(0);
  });

  it('reports a branch without runs', async () => {
    const h = harness({ pipeline: [PASSED], latest: [] });
    const command = new LogsPipelineCommand(
      h.api,
      repoContext(),
      createMockGitService({ currentBranch: 'main' }),
      createMockOutputService()
    );

    const error = await captureError(
      command.execute({}, { globalOptions: {} })
    );

    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
    expect(error.message).toBe(
      'No pipelines found for branch main in workspace/repo.'
    );
  });
});

describe('LogsPipelineCommand --follow', () => {
  function followCommand(h: Harness, output = createMockOutputService()) {
    return {
      output,
      command: new LogsPipelineCommand(
        h.api,
        repoContext(),
        createMockGitService(),
        output,
        h.sleep
      ),
    };
  }

  it('prints only new bytes each poll using Range requests', async () => {
    const h = harness({
      pipeline: [RUNNING, RUNNING, RUNNING, PASSED],
      steps: [
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }],
      ],
      logs: {
        '{s1}': [undefined, 'one\n', 'one\n', 'one\ntwo\n'],
      },
    });
    const { command, output } = followCommand(h);

    await command.execute(
      { id: '42', follow: true, interval: '2' },
      { globalOptions: {} }
    );

    expect(rawOutput(output.logs)).toBe('one\ntwo\n');
    expect(h.ranges).toEqual([undefined, undefined, 'bytes=4-', 'bytes=4-']);
    expect(h.sleeps).toEqual([2000, 2000, 2000]);
  });

  it('cuts the printed prefix when the server ignores Range', async () => {
    const h = harness({
      pipeline: [RUNNING, PASSED],
      steps: [
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }],
      ],
      logs: { '{s1}': ['héllo ', 'héllo wörld\n'] },
      ignoreRange: true,
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(rawOutput(output.logs)).toBe('héllo wörld\n');
  });

  it('follows every step in order with a header per step', async () => {
    const build = { uuid: '{s1}', name: 'Build' };
    const test = { uuid: '{s2}', name: 'Test' };
    const h = harness({
      pipeline: [RUNNING, FAILED],
      steps: [
        [
          { ...build, state: STEP_RUNNING },
          { ...test, state: STEP_PENDING },
        ],
        [
          { ...build, state: STEP_PASSED },
          { ...test, state: STEP_FAILED },
        ],
      ],
      logs: {
        '{s1}': ['compiling', 'compiling\ndone\n'],
        '{s2}': [undefined, 'boom\n'],
      },
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(output.logs).toEqual([
      'text:==> Step 1: Build',
      'raw:compiling',
      'raw:\ndone\n',
      'text:==> Step 2: Test',
      'raw:boom\n',
    ]);
  });

  it('announces a step once while it waits for its first log bytes', async () => {
    const steps = (first: unknown, second: unknown) => [
      { uuid: '{s1}', name: 'Build', state: first },
      { uuid: '{s2}', name: 'Test', state: second },
    ];
    const h = harness({
      pipeline: [PENDING, RUNNING, PASSED],
      steps: [
        steps(STEP_PENDING, STEP_PENDING),
        steps(STEP_RUNNING, STEP_PENDING),
        steps(STEP_PASSED, STEP_PASSED),
      ],
      logs: {
        '{s1}': [undefined, undefined, 'built\n'],
        '{s2}': [undefined, undefined, 'tested\n'],
      },
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(output.logs).toEqual([
      'text:==> Step 1: Build',
      'raw:built\n',
      'text:==> Step 2: Test',
      'raw:tested\n',
    ]);
  });

  it('stops after the --step step finishes even while the run continues', async () => {
    const h = harness({
      pipeline: [RUNNING],
      steps: [
        [
          { uuid: '{s1}', name: 'Build', state: STEP_PASSED },
          { uuid: '{s2}', name: 'Deploy', state: STEP_RUNNING },
        ],
      ],
      logs: { '{s1}': ['built'] },
    });
    const { command, output } = followCommand(h);

    await command.execute(
      { id: '42', follow: true, step: '1' },
      { globalOptions: {} }
    );

    expect(output.logs).toEqual(['raw:built', 'text:']);
    expect(h.sleeps).toEqual([]);
  });

  it('waits for a queued run to get steps', async () => {
    const h = harness({
      pipeline: [PENDING, PASSED],
      steps: [[], [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }]],
      logs: { '{s1}': [undefined, 'ok\n'] },
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(rawOutput(output.logs)).toBe('ok\n');
  });

  it('keeps polling when a completed run still lists a running step', async () => {
    const h = harness({
      pipeline: [PASSED],
      steps: [
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }],
      ],
      logs: { '{s1}': ['part', 'part and tail\n'] },
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(rawOutput(output.logs)).toBe('part and tail\n');
    expect(h.sleeps).toHaveLength(1);
  });

  it('never prints half of a UTF-8 character split across polls', async () => {
    const full = 'caf\u00e9\n';
    const bytes = new TextEncoder().encode(full);
    const h = harness({
      pipeline: [RUNNING, PASSED],
      steps: [
        [{ uuid: '{s1}', name: 'Build', state: STEP_RUNNING }],
        [{ uuid: '{s1}', name: 'Build', state: STEP_PASSED }],
      ],
      logs: { '{s1}': [bytes.slice(0, 4), full] },
    });
    const { command, output } = followCommand(h);

    await command.execute({ id: '42', follow: true }, { globalOptions: {} });

    expect(output.logs).toEqual(['raw:caf', 'raw:\u00e9\n']);
  });

  it('rejects --follow with --json', async () => {
    const h = harness({ pipeline: [PASSED] });
    const { command } = followCommand(h);

    const error = await captureError(
      command.execute(
        { id: '42', follow: true },
        { globalOptions: { json: true } }
      )
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(error.message).toContain('cannot be combined with --json');
  });
});
