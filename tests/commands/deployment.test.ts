/**
 * Deployment command tests
 */

import { describe, expect, it } from 'bun:test';
import { ListDeploymentsCommand } from '../../src/commands/deployment/list.command.js';
import { ViewDeploymentCommand } from '../../src/commands/deployment/view.command.js';
import { ListEnvironmentsCommand } from '../../src/commands/deployment/environments.command.js';
import {
  getDeploymentDate,
  getDeploymentStatus,
} from '../../src/commands/deployment/shared.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type {
  Deployment,
  DeploymentEnvironment,
  DeploymentsApi,
} from '../../src/generated/api.js';

const completed: Deployment = {
  type: 'deployment',
  uuid: '{dep-1}',
  environment: { type: 'deployment_environment', uuid: '{env-prod}' },
  release: {
    type: 'deployment_release',
    name: '#42',
    commit: { type: 'commit', hash: 'abcdef0123456789abcdef' },
    created_on: '2026-02-01T00:00:00.000Z',
  },
  state: {
    type: 'deployment_state_completed',
    name: 'COMPLETED',
    status: {
      type: 'deployment_state_completed_status_successful',
      name: 'SUCCESSFUL',
    },
    deployer: { display_name: 'Ada' },
    start_date: '2026-02-01T00:01:00.000Z',
    completion_date: '2026-02-01T00:05:00.000Z',
    url: 'https://bitbucket.org/acme/app/pipelines/results/42',
  },
};

const inProgress: Deployment = {
  type: 'deployment',
  uuid: '{dep-2}',
  environment: { type: 'deployment_environment', uuid: '{env-unknown}' },
  state: {
    type: 'deployment_state_in_progress',
    name: 'IN_PROGRESS',
    start_date: '2026-02-02T00:00:00.000Z',
  },
};

const environments: DeploymentEnvironment[] = [
  {
    type: 'deployment_environment',
    uuid: '{env-prod}',
    name: 'Production',
    environment_type: { name: 'Production' },
  },
];

function repoContextService() {
  return createMockContextService({ workspace: 'acme', repoSlug: 'app' });
}

function createMockDeploymentsApi(
  options: { deployments?: Deployment[]; notFound?: boolean } = {}
): { api: DeploymentsApi; calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = {
    list: [],
    get: [],
    environments: [],
  };
  const api = {
    getDeploymentsForRepository: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      calls.list!.push({ request, axiosOptions });
      return {
        data: { values: options.deployments ?? [completed, inProgress] },
      };
    },
    getDeploymentForRepository: async (request: unknown) => {
      calls.get!.push(request);
      if (options.notFound) throw new APIError('Resource not found', 404);
      return { data: completed };
    },
    getEnvironmentsForRepository: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      calls.environments!.push({ request, axiosOptions });
      return { data: { values: environments } };
    },
  } as unknown as DeploymentsApi;
  return { api, calls };
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const log = logs.find((l) => l.startsWith('json:'));
  expect(log).toBeDefined();
  return JSON.parse(log!.slice('json:'.length)) as Record<string, unknown>;
}

describe('deployment shared helpers', () => {
  it('prefers the completed status over the state name', () => {
    expect(getDeploymentStatus(completed)).toBe('SUCCESSFUL');
    expect(getDeploymentStatus(inProgress)).toBe('IN_PROGRESS');
    expect(getDeploymentStatus({ type: 'deployment' })).toBe('-');
  });

  it('picks completion, then start, then release date', () => {
    expect(getDeploymentDate(completed)).toBe('2026-02-01T00:05:00.000Z');
    expect(getDeploymentDate(inProgress)).toBe('2026-02-02T00:00:00.000Z');
    expect(
      getDeploymentDate({
        type: 'deployment',
        release: { type: 'deployment_release', created_on: '2026-01-01' },
      })
    ).toBe('2026-01-01');
  });
});

describe('ListDeploymentsCommand', () => {
  it('resolves environment names and renders the table', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockDeploymentsApi();
    const command = new ListDeploymentsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect((calls.list![0] as { request: unknown }).request).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
    });
    expect(calls.environments).toHaveLength(1);
    expect(output.logs).toContain(
      'table:UUID,ENVIRONMENT,STATUS,RELEASE,COMMIT,DATE'
    );
    const rows = JSON.parse(
      output.logs
        .find((l) => l.startsWith('table-rows:'))!
        .slice('table-rows:'.length)
    ) as string[][];
    expect(rows).toEqual([
      [
        '{dep-1}',
        'Production',
        'SUCCESSFUL',
        '#42',
        'abcdef012345',
        '2026-02-01T00:05:00.000Z',
      ],
      [
        '{dep-2}',
        '{env-unknown}',
        'IN_PROGRESS',
        '-',
        '-',
        '2026-02-02T00:00:00.000Z',
      ],
    ]);
  });

  it('emits raw deployments as JSON without the environment lookup', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockDeploymentsApi();
    const command = new ListDeploymentsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    expect(calls.environments).toHaveLength(0);
    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'count',
      'deployments',
    ]);
    expect(payload.count).toBe(2);
  });

  it('prints an empty-state message', async () => {
    const output = createMockOutputService();
    const { api } = createMockDeploymentsApi({ deployments: [] });
    const command = new ListDeploymentsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No deployments found in acme/app');
  });
});

describe('ViewDeploymentCommand', () => {
  it('renders deployment details with the environment name', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockDeploymentsApi();
    const command = new ViewDeploymentCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({ uuid: '{dep-1}' }, { globalOptions: {} });

    expect(calls.get![0]).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
      deploymentUuid: '{dep-1}',
    });
    expect(output.logs).toContain('text:Production  SUCCESSFUL');
    expect(output.logs).toContain('text:Release:     #42');
    expect(output.logs).toContain('text:Deployer:    Ada');
    expect(output.logs).toContain(
      'text:https://bitbucket.org/acme/app/pipelines/results/42'
    );
  });

  it('wraps the deployment in a JSON envelope', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockDeploymentsApi();
    const command = new ViewDeploymentCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute(
      { uuid: '{dep-1}' },
      { globalOptions: { json: true } }
    );

    expect(calls.environments).toHaveLength(0);
    expect(Object.keys(getJsonPayload(output.logs))).toEqual([
      'workspace',
      'repoSlug',
      'deployment',
    ]);
  });

  it('adds repository context to a 404', async () => {
    const { api } = createMockDeploymentsApi({ notFound: true });
    const command = new ViewDeploymentCommand(
      api,
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ uuid: '{nope}' }, { globalOptions: {} })
    ).rejects.toThrow('Deployment {nope} not found in acme/app.');
  });
});

describe('ListEnvironmentsCommand', () => {
  it('renders environments with their type', async () => {
    const output = createMockOutputService();
    const { api } = createMockDeploymentsApi();
    const command = new ListEnvironmentsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('table:NAME,TYPE,UUID');
    expect(output.logs).toContain(
      `table-rows:${JSON.stringify([['Production', 'Production', '{env-prod}']])}`
    );
  });

  it('emits { workspace, repoSlug, count, environments } as JSON', async () => {
    const output = createMockOutputService();
    const { api } = createMockDeploymentsApi();
    const command = new ListEnvironmentsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    expect(Object.keys(getJsonPayload(output.logs))).toEqual([
      'workspace',
      'repoSlug',
      'count',
      'environments',
    ]);
  });
});
