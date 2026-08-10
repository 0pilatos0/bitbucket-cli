/**
 * Project command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListProjectsCommand } from '../../src/commands/project/list.command.js';
import { ViewProjectCommand } from '../../src/commands/project/view.command.js';
import { CreateProjectCommand } from '../../src/commands/project/create.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type {
  Project,
  ProjectsApi,
  WorkspacesApi,
} from '../../src/generated/api.js';

const mockProject: Project = {
  type: 'project',
  uuid: '{proj-uuid}',
  key: 'PROJ',
  name: 'My Project',
  description: 'Internal tooling project',
  is_private: true,
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-02T00:00:00.000Z',
  links: {
    html: { href: 'https://bitbucket.org/acme/workspace/projects/PROJ' },
  },
};

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

function createMockWorkspacesApi(
  options: {
    projects?: Project[];
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
  } = {}
): WorkspacesApi {
  const projects = options.projects ?? [mockProject];

  return {
    workspacesWorkspaceProjectsGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      options.onListCall?.(request, axiosOptions);
      const params = (
        axiosOptions as { params?: { page?: number; pagelen?: number } }
      )?.params;
      const page = params?.page ?? 1;
      const pagelen = params?.pagelen ?? 25;
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      return {
        data: {
          values: projects.slice(start, end),
          page,
          pagelen,
          size: projects.length,
          next:
            end < projects.length
              ? `https://api.bitbucket.org/2.0/workspaces/acme/projects?page=${page + 1}`
              : undefined,
        },
      };
    },
  } as unknown as WorkspacesApi;
}

function createMockProjectsApi(
  options: {
    projectNotFound?: boolean;
    onViewCall?: (request: unknown) => void;
    onCreateCall?: (request: unknown) => void;
  } = {}
): ProjectsApi {
  return {
    workspacesWorkspaceProjectsProjectKeyGet: async (request: unknown) => {
      if (options.projectNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.onViewCall?.(request);
      return { data: mockProject };
    },
    workspacesWorkspaceProjectsPost: async (request: unknown) => {
      options.onCreateCall?.(request);
      const project = (request as { body: Project }).body;
      return { data: { ...mockProject, ...project } };
    },
  } as unknown as ProjectsApi;
}

function workspaceContextService() {
  return createMockContextService({ defaultWorkspace: 'acme' });
}

describe('ListProjectsCommand', () => {
  it('should render the projects table with key, name, privacy, description, and date', async () => {
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi(),
      workspaceContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('table:KEY,NAME,PRIVACY,DESCRIPTION,UPDATED')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      'PROJ',
      'My Project',
      'private',
      'Internal tooling project',
      '2024-01-02T00:00:00.000Z',
    ]);
  });

  it('should resolve the workspace and pass pagination params through axios options', async () => {
    let capturedRequest: { workspace?: string } | undefined;
    let capturedParams: Record<string, unknown> | undefined;
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi({
        onListCall: (request, axiosOptions) => {
          capturedRequest = request as { workspace?: string };
          capturedParams = (
            axiosOptions as { params?: Record<string, unknown> }
          )?.params;
        },
      }),
      workspaceContextService(),
      output
    );

    await command.execute({ workspace: 'other-ws' }, { globalOptions: {} });

    expect(capturedRequest?.workspace).toBe('other-ws');
    expect(capturedParams?.page).toBe(1);
    expect(capturedParams?.pagelen).toBeDefined();
  });

  it('should emit the JSON envelope with workspace, count, and projects', async () => {
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi(),
      workspaceContextService(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'count', 'projects']);
    expect(payload.workspace).toBe('acme');
    expect(payload.count).toBe(1);
    expect(payload.projects).toEqual([JSON.parse(JSON.stringify(mockProject))]);
  });

  it('should show the empty state with the workspace name', async () => {
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi({ projects: [] }),
      workspaceContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No projects found in workspace acme');
  });

  it('should cap results at --limit and print the more-results hint', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...mockProject,
      key: `PROJ${i + 1}`,
    }));
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi({ projects: many }),
      workspaceContextService(),
      output
    );

    await command.execute({ limit: '3' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(3);
    expect(output.logs.some((log) => log.includes('Showing 3 projects'))).toBe(
      true
    );
  });

  it('should fail without a resolvable workspace', async () => {
    const output = createMockOutputService();
    const command = new ListProjectsCommand(
      createMockWorkspacesApi(),
      createMockContextService(),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'No workspace specified'
    );
  });
});

describe('ViewProjectCommand', () => {
  it('should render project details', async () => {
    const output = createMockOutputService();
    const command = new ViewProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await command.execute({ key: 'PROJ' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('PROJ'))).toBe(true);
    expect(output.logs.some((log) => log.includes('My Project'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Internal tooling project'))
    ).toBe(true);
  });

  it('should uppercase the key before calling the API', async () => {
    let captured: { projectKey?: string; workspace?: string } | undefined;
    const output = createMockOutputService();
    const command = new ViewProjectCommand(
      createMockProjectsApi({
        onViewCall: (request) => {
          captured = request as { projectKey?: string; workspace?: string };
        },
      }),
      workspaceContextService(),
      output
    );

    await command.execute({ key: 'proj' }, { globalOptions: {} });

    expect(captured?.projectKey).toBe('PROJ');
    expect(captured?.workspace).toBe('acme');
  });

  it('should emit the JSON envelope { workspace, project }', async () => {
    const output = createMockOutputService();
    const command = new ViewProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await command.execute({ key: 'PROJ' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'project']);
    expect(payload.workspace).toBe('acme');
    expect(payload.project).toEqual(JSON.parse(JSON.stringify(mockProject)));
  });

  it('should add a friendly message to a 404', async () => {
    const output = createMockOutputService();
    const command = new ViewProjectCommand(
      createMockProjectsApi({ projectNotFound: true }),
      workspaceContextService(),
      output
    );

    await expect(
      command.execute({ key: 'GHOST' }, { globalOptions: {} })
    ).rejects.toThrow('Project GHOST not found in workspace acme.');
  });
});

describe('CreateProjectCommand', () => {
  it('should POST a typed project body (private by default)', async () => {
    let captured:
      { workspace?: string; body?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi({
        onCreateCall: (request) => {
          captured = request as {
            workspace?: string;
            body?: Record<string, unknown>;
          };
        },
      }),
      workspaceContextService(),
      output
    );

    await command.execute(
      { key: 'PROJ', name: 'My Project', description: 'Team things' },
      { globalOptions: {} }
    );

    expect(captured?.workspace).toBe('acme');
    expect(captured?.body).toEqual({
      type: 'project',
      key: 'PROJ',
      name: 'My Project',
      description: 'Team things',
      is_private: true,
    });
    expect(output.logs).toContain('success:Project PROJ created in acme');
    expect(
      output.logs.some((log) => log.includes('bb repo create <name> -p PROJ'))
    ).toBe(true);
  });

  it('should omit description when not given and honor --public', async () => {
    let captured: { body?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi({
        onCreateCall: (request) => {
          captured = request as { body?: Record<string, unknown> };
        },
      }),
      workspaceContextService(),
      output
    );

    await command.execute(
      { key: 'PROJ', name: 'My Project', public: true },
      { globalOptions: {} }
    );

    expect(captured?.body).toEqual({
      type: 'project',
      key: 'PROJ',
      name: 'My Project',
      is_private: false,
    });
  });

  it('should uppercase a lowercase key and mention the normalization', async () => {
    let captured: { body?: { key?: string } } | undefined;
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi({
        onCreateCall: (request) => {
          captured = request as { body?: { key?: string } };
        },
      }),
      workspaceContextService(),
      output
    );

    await command.execute(
      { key: 'proj', name: 'My Project' },
      { globalOptions: {} }
    );

    expect(captured?.body?.key).toBe('PROJ');
    expect(output.logs).toContain(
      'info:Project keys are uppercase on Bitbucket; using PROJ.'
    );
  });

  it('should reject a key that is not a valid project key', async () => {
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await expect(
      command.execute(
        { key: '1-bad key', name: 'My Project' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--key must start with a letter');
  });

  it('should reject --private together with --public', async () => {
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await expect(
      command.execute(
        { key: 'PROJ', name: 'My Project', private: true, public: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--private and --public cannot both be set.');
  });

  it('should require --key and --name', async () => {
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await expect(
      command.execute({ name: 'My Project' }, { globalOptions: {} })
    ).rejects.toThrow('Option --key is required');
    await expect(
      command.execute({ key: 'PROJ' }, { globalOptions: {} })
    ).rejects.toThrow('Option --name is required');
  });

  it('should emit the JSON envelope { workspace, project }', async () => {
    const output = createMockOutputService();
    const command = new CreateProjectCommand(
      createMockProjectsApi(),
      workspaceContextService(),
      output
    );

    await command.execute(
      { key: 'PROJ', name: 'My Project' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'project']);
    expect(payload.workspace).toBe('acme');
    expect((payload.project as { key?: string }).key).toBe('PROJ');
  });
});
