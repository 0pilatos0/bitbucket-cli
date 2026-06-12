/**
 * Pipeline command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListPipelinesCommand } from '../../src/commands/pipeline/list.command.js';
import { ViewPipelineCommand } from '../../src/commands/pipeline/view.command.js';
import { RunPipelineCommand } from '../../src/commands/pipeline/run.command.js';
import { StopPipelineCommand } from '../../src/commands/pipeline/stop.command.js';
import { LogsPipelineCommand } from '../../src/commands/pipeline/logs.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
} from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type { Pipeline, PipelinesApi } from '../../src/generated/api.js';

const mockPipeline: Pipeline = {
  type: 'pipeline',
  uuid: '{pipeline-uuid-1}',
  build_number: 42,
  state: {
    type: 'pipeline_state_completed',
    name: 'COMPLETED',
    result: { type: 'pipeline_state_completed_passed', name: 'PASSED' },
  } as unknown as Pipeline['state'],
  target: {
    type: 'pipeline_ref_target',
    ref_type: 'branch',
    ref_name: 'main',
  } as unknown as Pipeline['target'],
  trigger: {
    type: 'pipeline_trigger_push',
    name: 'PUSH',
  } as unknown as Pipeline['trigger'],
  creator: { type: 'user', display_name: 'Test User' },
  created_on: '2024-01-01T00:00:00.000Z',
  completed_on: '2024-01-01T00:02:03.000Z',
  build_seconds_used: 123,
};

const mockStepOne = {
  type: 'pipeline_step',
  uuid: '{step-uuid-1}',
  name: 'Build',
  state: {
    type: 'pipeline_step_state_completed',
    name: 'COMPLETED',
    result: {
      type: 'pipeline_step_state_completed_successful',
      name: 'SUCCESSFUL',
    },
  },
  started_on: '2024-01-01T00:00:10.000Z',
  completed_on: '2024-01-01T00:01:10.000Z',
  duration_in_seconds: 60,
};

const mockStepTwo = {
  type: 'pipeline_step',
  uuid: '{step-uuid-2}',
  name: 'Deploy',
  state: {
    type: 'pipeline_step_state_completed',
    name: 'COMPLETED',
    result: { type: 'pipeline_step_state_completed_failed', name: 'FAILED' },
  },
  started_on: '2024-01-01T00:01:10.000Z',
  completed_on: '2024-01-01T00:02:00.000Z',
  duration_in_seconds: 50,
};

function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  const params = (
    axiosOptions as { params?: { page?: number; pagelen?: number } }
  )?.params;
  return { page: params?.page ?? 1, pagelen: params?.pagelen ?? 25 };
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }
  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

function createMockPipelinesApi(
  options: {
    pipelines?: Pipeline[];
    steps?: unknown[];
    log?: string;
    pipelineNotFound?: boolean;
    onList?: (request: unknown, axiosOptions?: unknown) => void;
    onCreate?: (request: unknown) => void;
    onStop?: (request: unknown) => void;
    onLog?: (request: unknown, axiosOptions?: unknown) => void;
    createdPipeline?: Pipeline;
  } = {}
): PipelinesApi {
  const pipelines = options.pipelines ?? [mockPipeline];
  const steps = options.steps ?? [mockStepOne];

  return {
    getPipelinesForRepository: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      options.onList?.(request, axiosOptions);
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      return {
        data: {
          values: pipelines.slice(start, end),
          page,
          pagelen,
          size: pipelines.length,
          next:
            end < pipelines.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pipelines/?page=${page + 1}`
              : undefined,
        },
      };
    },
    getPipelineForRepository: async ({
      pipelineUuid,
    }: {
      pipelineUuid: string;
    }) => {
      if (options.pipelineNotFound) {
        throw new APIError('Resource not found', 404);
      }
      return {
        data:
          pipelines.find(
            (p) =>
              p.uuid === pipelineUuid || String(p.build_number) === pipelineUuid
          ) ?? mockPipeline,
      };
    },
    getPipelineStepsForRepository: async (
      _request: unknown,
      axiosOptions?: unknown
    ) => {
      if (options.pipelineNotFound) {
        throw new APIError('Resource not found', 404);
      }
      // Mirror the live API: the steps collection is paginated with a
      // server-side default pagelen of 10, so callers that don't paginate
      // only ever see the first 10 steps.
      const params = (
        axiosOptions as { params?: { page?: number; pagelen?: number } }
      )?.params;
      const page = params?.page ?? 1;
      const pagelen = params?.pagelen ?? 10;
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      return {
        data: {
          values: steps.slice(start, end),
          page,
          pagelen,
          size: steps.length,
          next:
            end < steps.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/pipelines/42/steps/?page=${page + 1}`
              : undefined,
        },
      };
    },
    getPipelineStepLogForRepository: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      options.onLog?.(request, axiosOptions);
      return { data: options.log ?? 'log line 1\nlog line 2' };
    },
    createPipelineForRepository: async (request: unknown) => {
      options.onCreate?.(request);
      return { data: options.createdPipeline ?? mockPipeline };
    },
    stopPipeline: async (request: unknown) => {
      if (options.pipelineNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.onStop?.(request);
      return { data: undefined };
    },
  } as unknown as PipelinesApi;
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

function makeSteps(count: number): unknown[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockStepOne,
    uuid: `{step-uuid-${index + 1}}`,
    name: `Step ${index + 1}`,
  }));
}

describe('ListPipelinesCommand', () => {
  it('should render the pipelines table', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi(),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('table:ID,STATUS,REF,TRIGGER,CREATED,DURATION')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]).toBe('#42');
    expect(rows[0]![1]).toBe('PASSED');
    expect(rows[0]![2]).toBe('main');
    expect(rows[0]![3]).toBe('PUSH');
    expect(rows[0]![5]).toBe('2m 3s');
  });

  it('should emit the JSON envelope with metadata-first key order', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi(),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'sort',
      'count',
      'pipelines',
    ]);
    expect(payload.workspace).toBe('workspace');
    expect(payload.repoSlug).toBe('repo');
    expect(payload.sort).toBe('-created_on');
    expect(payload.count).toBe(1);
    expect(payload.pipelines).toHaveLength(1);
  });

  it('should pass status and branch filters to the API (status normalized to uppercase)', async () => {
    let captured: unknown;
    let capturedAxios: unknown;
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi({
        onList: (request, axiosOptions) => {
          captured = request;
          capturedAxios = axiosOptions;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { status: 'failed', branch: 'main' },
      { globalOptions: { json: true } }
    );

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      status: 'FAILED',
      targetBranch: 'main',
    });
    expect((capturedAxios as { params: { sort: string } }).params.sort).toBe(
      '-created_on'
    );

    const payload = getJsonPayload(output.logs);
    expect(payload.status).toBe('FAILED');
    expect(payload.branch).toBe('main');
  });

  it('should reject an invalid --status value', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ status: 'bogus' }, { globalOptions: {} })
    ).rejects.toThrow('--status must be one of');
  });

  it('should reject an invalid --sort value', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ sort: 'name' }, { globalOptions: {} })
    ).rejects.toThrow('--sort must be one of');
  });

  it('should show empty state when no pipelines exist', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi({ pipelines: [] }),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No pipelines found');
  });

  it('should mention filters in the empty state when filtering', async () => {
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi({ pipelines: [] }),
      repoContextService(),
      output
    );

    await command.execute({ status: 'FAILED' }, { globalOptions: {} });

    expect(output.logs).toContain(
      'info:No pipelines found matching the given filters'
    );
  });

  it('should respect --limit and print the more-results hint', async () => {
    const pipelines = [
      { ...mockPipeline, build_number: 42 },
      { ...mockPipeline, uuid: '{pipeline-uuid-2}', build_number: 43 },
    ];
    const output = createMockOutputService();
    const command = new ListPipelinesCommand(
      createMockPipelinesApi({ pipelines }),
      repoContextService(),
      output
    );

    await command.execute({ limit: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(
      output.logs.some((log) =>
        log.includes(
          'Showing 1 pipelines. Use --limit <n> or --all to see more.'
        )
      )
    ).toBe(true);
  });
});

describe('ViewPipelineCommand', () => {
  it('should render pipeline details with a step summary', async () => {
    const output = createMockOutputService();
    const command = new ViewPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne, mockStepTwo] }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('Pipeline #42'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Status: PASSED'))).toBe(
      true
    );
    expect(output.logs.some((log) => log.includes('Ref: main'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Trigger: PUSH'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Duration: 2m 3s'))).toBe(
      true
    );
    const rows = getTableRows(output.logs);
    expect(rows).toEqual([
      ['1', 'Build', 'SUCCESSFUL', '1m 0s'],
      ['2', 'Deploy', 'FAILED', '50s'],
    ]);
  });

  it('should emit the documented JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new ViewPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne] }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'pipeline',
      'steps',
    ]);
    expect((payload.pipeline as Pipeline).build_number).toBe(42);
    expect(payload.steps).toHaveLength(1);
  });

  it('should add contextual message on 404', async () => {
    const output = createMockOutputService();
    const command = new ViewPipelineCommand(
      createMockPipelinesApi({ pipelineNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow('Pipeline 999 not found in workspace/repo.');
  });

  it('should collect every step across paginated responses', async () => {
    const output = createMockOutputService();
    const command = new ViewPipelineCommand(
      createMockPipelinesApi({ steps: makeSteps(60) }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(payload.steps).toHaveLength(60);
    expect(
      (payload.steps as { name: string }[]).map((step) => step.name)
    ).toContain('Step 60');
  });
});

describe('RunPipelineCommand', () => {
  it('should construct the exact pipeline body from flags', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new RunPipelineCommand(
      createMockPipelinesApi({ onCreate: (request) => (captured = request) }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute(
      {
        branch: 'release/1.0',
        commit: 'abc123def456',
        pipeline: 'deploy-prod',
        var: ['ENV=prod', 'FLAGS=a=b'],
      },
      { globalOptions: {} }
    );

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipeline: {
        type: 'pipeline',
        target: {
          type: 'pipeline_ref_target',
          ref_type: 'branch',
          ref_name: 'release/1.0',
          commit: { type: 'commit', hash: 'abc123def456' },
          selector: { type: 'custom', pattern: 'deploy-prod' },
        },
        variables: [
          {
            type: 'pipeline_variable',
            key: 'ENV',
            value: 'prod',
            secured: false,
          },
          {
            type: 'pipeline_variable',
            key: 'FLAGS',
            value: 'a=b',
            secured: false,
          },
        ],
      },
    });
    expect(
      output.logs.some((log) =>
        log.includes('Pipeline #42 started on branch release/1.0')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log.includes('bb pipeline view 42'))).toBe(
      true
    );
  });

  it('should default to the current git branch and omit commit/selector/variables', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new RunPipelineCommand(
      createMockPipelinesApi({ onCreate: (request) => (captured = request) }),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'feature/x' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipeline: {
        type: 'pipeline',
        target: {
          type: 'pipeline_ref_target',
          ref_type: 'branch',
          ref_name: 'feature/x',
        },
      },
    });
  });

  it('should fail with an actionable error when not in a git repo and no --branch', async () => {
    const output = createMockOutputService();
    const command = new RunPipelineCommand(
      createMockPipelinesApi(),
      repoContextService(),
      createMockGitService({ throwOnGetCurrentBranch: true }),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'Pass --branch <branch>'
    );
  });

  it('should reject malformed --var entries', async () => {
    const output = createMockOutputService();
    const command = new RunPipelineCommand(
      createMockPipelinesApi(),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await expect(
      command.execute({ var: ['NOVALUE'] }, { globalOptions: {} })
    ).rejects.toThrow('--var must be in key=value format');
  });

  it('should emit the documented JSON envelope with the created pipeline', async () => {
    const output = createMockOutputService();
    const command = new RunPipelineCommand(
      createMockPipelinesApi(),
      repoContextService(),
      createMockGitService({ isRepo: true, currentBranch: 'main' }),
      output
    );

    await command.execute(
      { branch: 'main' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'pipeline']);
    expect(payload.workspace).toBe('workspace');
    expect(payload.repoSlug).toBe('repo');
    expect((payload.pipeline as Pipeline).build_number).toBe(42);
    expect((payload.pipeline as Pipeline).uuid).toBe('{pipeline-uuid-1}');
  });
});

describe('StopPipelineCommand', () => {
  it('should stop a pipeline by raw id and print a success message', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new StopPipelineCommand(
      createMockPipelinesApi({ onStop: (request) => (captured = request) }),
      repoContextService(),
      output
    );

    await command.execute({ id: '{pipeline-uuid-1}' }, { globalOptions: {} });

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipelineUuid: '{pipeline-uuid-1}',
    });
    expect(output.logs).toContain('success:Pipeline {pipeline-uuid-1} stopped');
  });

  it('should emit the documented JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new StopPipelineCommand(
      createMockPipelinesApi(),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipelineId: '42',
      stopped: true,
    });
  });

  it('should add contextual message on 404', async () => {
    const output = createMockOutputService();
    const command = new StopPipelineCommand(
      createMockPipelinesApi({ pipelineNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow('Pipeline 999 not found in workspace/repo.');
  });
});

describe('LogsPipelineCommand', () => {
  it('should auto-pick the only step and print the raw log', async () => {
    let captured: unknown;
    let capturedAxios: unknown;
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({
        steps: [mockStepOne],
        log: 'building...\ndone.',
        onLog: (request, axiosOptions) => {
          captured = request;
          capturedAxios = axiosOptions;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipelineUuid: '42',
      stepUuid: '{step-uuid-1}',
    });
    expect(capturedAxios).toEqual({ responseType: 'text' });
    expect(output.logs).toContain('text:building...\ndone.');
  });

  it('should pick a step by 1-based index', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({
        steps: [mockStepOne, mockStepTwo],
        onLog: (request) => (captured = request),
      }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42', step: '2' }, { globalOptions: {} });

    expect((captured as { stepUuid: string }).stepUuid).toBe('{step-uuid-2}');
  });

  it('should pick a step by UUID (braces optional)', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({
        steps: [mockStepOne, mockStepTwo],
        onLog: (request) => (captured = request),
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { id: '42', step: 'step-uuid-2' },
      { globalOptions: {} }
    );

    expect((captured as { stepUuid: string }).stepUuid).toBe('{step-uuid-2}');
  });

  it('should error when --step matches no step', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne, mockStepTwo] }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '42', step: '{nope-uuid}' }, { globalOptions: {} })
    ).rejects.toThrow("No step matching '{nope-uuid}' found");
  });

  it('should error when --step index is out of range', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne, mockStepTwo] }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '42', step: '5' }, { globalOptions: {} })
    ).rejects.toThrow('--step index 5 is out of range');
  });

  it('should list steps instead of guessing when several exist and no --step', async () => {
    let logFetched = false;
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({
        steps: [mockStepOne, mockStepTwo],
        onLog: () => {
          logFetched = true;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(logFetched).toBe(false);
    expect(
      output.logs.some((log) =>
        log.includes('Pass --step <uuid-or-index> to pick one')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows.map((row) => row[3])).toEqual([
      '{step-uuid-1}',
      '{step-uuid-2}',
    ]);
  });

  it('should return the steps in JSON mode when several exist and no --step', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne, mockStepTwo] }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'pipelineId',
      'count',
      'steps',
    ]);
    expect(payload.count).toBe(2);
  });

  it('should emit the documented JSON log envelope', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: [mockStepOne], log: 'the log' }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    expect(getJsonPayload(output.logs)).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      pipelineId: '42',
      stepUuid: '{step-uuid-1}',
      log: 'the log',
    });
  });

  it('should select a step beyond the first API page by index', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({
        steps: makeSteps(60),
        onLog: (request) => (captured = request),
      }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42', step: '55' }, { globalOptions: {} });

    expect((captured as { stepUuid: string }).stepUuid).toBe('{step-uuid-55}');
  });

  it('should count and list every step across pages when no --step', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: makeSteps(60) }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(payload.count).toBe(60);
    expect(payload.steps).toHaveLength(60);
  });

  it('should error when the pipeline has no steps yet', async () => {
    const output = createMockOutputService();
    const command = new LogsPipelineCommand(
      createMockPipelinesApi({ steps: [] }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '42' }, { globalOptions: {} })
    ).rejects.toThrow('Pipeline 42 has no steps yet');
  });
});
