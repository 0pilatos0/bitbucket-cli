/**
 * Workspace command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListWorkspacesCommand } from '../../src/commands/workspace/list.command.js';
import { ViewWorkspaceCommand } from '../../src/commands/workspace/view.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type { Workspace, WorkspacesApi } from '../../src/generated/api.js';

const mockWorkspace: Workspace = {
  type: 'workspace',
  uuid: '{ws-uuid}',
  name: 'Acme Inc',
  slug: 'acme',
  is_private: true,
  is_privacy_enforced: false,
  forking_mode: 'allow_forks',
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-02T00:00:00.000Z',
  links: {
    html: { href: 'https://bitbucket.org/acme/' },
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
    workspaces?: Workspace[];
    workspaceNotFound?: boolean;
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
    onViewCall?: (request: unknown) => void;
  } = {}
): WorkspacesApi {
  const workspaces = options.workspaces ?? [mockWorkspace];

  return {
    workspacesGet: async (request: unknown, axiosOptions?: unknown) => {
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
          values: workspaces.slice(start, end),
          page,
          pagelen,
          size: workspaces.length,
          next:
            end < workspaces.length
              ? `https://api.bitbucket.org/2.0/workspaces?page=${page + 1}`
              : undefined,
        },
      };
    },
    workspacesWorkspaceGet: async (request: unknown) => {
      if (options.workspaceNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.onViewCall?.(request);
      return { data: mockWorkspace };
    },
  } as unknown as WorkspacesApi;
}

describe('ListWorkspacesCommand', () => {
  it('should render the workspaces table with slug, name, privacy, and uuid', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.startsWith('table:SLUG,NAME,PRIVACY,UUID'))
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(['acme', 'Acme Inc', 'private', '{ws-uuid}']);
  });

  it('should print a defaultWorkspace hint after the table', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('bb config set defaultWorkspace <slug>')
      )
    ).toBe(true);
  });

  it('should emit the JSON envelope with filters, count, and workspaces (and no hint)', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['filters', 'count', 'workspaces']);
    expect(payload.count).toBe(1);
    expect(payload.workspaces).toEqual([
      JSON.parse(JSON.stringify(mockWorkspace)),
    ]);
    expect(output.logs.some((log) => log.includes('defaultWorkspace'))).toBe(
      false
    );
  });

  it('should pass --role through to the API and into the JSON filters', async () => {
    let captured: { role?: string } | undefined;
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi({
        onListCall: (request) => {
          captured = request as { role?: string };
        },
      }),
      output
    );

    await command.execute({ role: 'owner' }, { globalOptions: { json: true } });

    expect(captured?.role).toBe('owner');
    const payload = getJsonPayload(output.logs);
    expect(payload.filters).toEqual({ role: 'owner' });
  });

  it('should reject an invalid --role', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi(),
      output
    );

    await expect(
      command.execute({ role: 'admin' }, { globalOptions: {} })
    ).rejects.toThrow('--role must be one of: owner, collaborator, member');
  });

  it('should show the empty state when no workspaces exist', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi({ workspaces: [] }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No workspaces found');
  });

  it('should mention the role in the empty state when --role filtered', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi({ workspaces: [] }),
      output
    );

    await command.execute({ role: 'collaborator' }, { globalOptions: {} });

    expect(output.logs).toContain(
      'info:No workspaces found for role "collaborator"'
    );
  });

  it('should cap results at --limit and print the more-results hint', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...mockWorkspace,
      slug: `ws-${i + 1}`,
    }));
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi({ workspaces: many }),
      output
    );

    await command.execute({ limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
    expect(
      output.logs.some((log) => log.includes('Showing 2 workspaces'))
    ).toBe(true);
  });

  it('should reject an invalid --limit', async () => {
    const output = createMockOutputService();
    const command = new ListWorkspacesCommand(
      createMockWorkspacesApi(),
      output
    );

    await expect(
      command.execute({ limit: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow('--limit must be a positive integer');
  });
});

describe('ViewWorkspaceCommand', () => {
  it('should view an explicitly passed slug without any workspace context', async () => {
    let captured: { workspace?: string } | undefined;
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi({
        onViewCall: (request) => {
          captured = request as { workspace?: string };
        },
      }),
      createMockContextService(),
      output
    );

    await command.execute({ slug: 'acme' }, { globalOptions: {} });

    expect(captured?.workspace).toBe('acme');
    expect(output.logs.some((log) => log.includes('acme'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Acme Inc'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('https://bitbucket.org/acme/'))
    ).toBe(true);
  });

  it('should default the slug from the resolved workspace context', async () => {
    let captured: { workspace?: string } | undefined;
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi({
        onViewCall: (request) => {
          captured = request as { workspace?: string };
        },
      }),
      createMockContextService({ defaultWorkspace: 'default-ws' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(captured?.workspace).toBe('default-ws');
  });

  it("should derive the slug from the current repository's git remote", async () => {
    let captured: { workspace?: string } | undefined;
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi({
        onViewCall: (request) => {
          captured = request as { workspace?: string };
        },
      }),
      createMockContextService({ workspace: 'remote-ws', repoSlug: 'repo' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(captured?.workspace).toBe('remote-ws');
  });

  it('should prefer the -w flag over the git remote', async () => {
    let captured: { workspace?: string } | undefined;
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi({
        onViewCall: (request) => {
          captured = request as { workspace?: string };
        },
      }),
      createMockContextService({ workspace: 'remote-ws', repoSlug: 'repo' }),
      output
    );

    await command.execute({}, { globalOptions: { workspace: 'flag-ws' } });

    expect(captured?.workspace).toBe('flag-ws');
  });

  it('should emit the JSON envelope { workspace }', async () => {
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi(),
      createMockContextService(),
      output
    );

    await command.execute({ slug: 'acme' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace']);
    expect(payload.workspace).toEqual(
      JSON.parse(JSON.stringify(mockWorkspace))
    );
  });

  it('should add a friendly message to a 404', async () => {
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi({ workspaceNotFound: true }),
      createMockContextService(),
      output
    );

    await expect(
      command.execute({ slug: 'ghost' }, { globalOptions: {} })
    ).rejects.toThrow(
      'Workspace ghost not found (or you do not have access to it).'
    );
  });

  it('should fail with the standard workspace-context error when nothing resolves', async () => {
    const output = createMockOutputService();
    const command = new ViewWorkspaceCommand(
      createMockWorkspacesApi(),
      createMockContextService(),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'No workspace specified'
    );
  });
});
