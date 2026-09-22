/**
 * Branch restriction command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListBranchRestrictionsCommand } from '../../src/commands/branch-restriction/list.command.js';
import { ViewBranchRestrictionCommand } from '../../src/commands/branch-restriction/view.command.js';
import { CreateBranchRestrictionCommand } from '../../src/commands/branch-restriction/create.command.js';
import { DeleteBranchRestrictionCommand } from '../../src/commands/branch-restriction/delete.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type {
  BranchRestrictionsApi,
  Branchrestriction,
  UsersApi,
} from '../../src/generated/api.js';

const globRestriction: Branchrestriction = {
  type: 'branchrestriction',
  id: 7,
  kind: 'require_approvals_to_merge',
  branch_match_kind: 'glob',
  pattern: 'main',
  value: 2,
};

const modelRestriction: Branchrestriction = {
  type: 'branchrestriction',
  id: 8,
  kind: 'push',
  branch_match_kind: 'branching_model',
  branch_type: 'production',
  pattern: '',
  users: [{ type: 'user', uuid: '{u1}', display_name: 'Ada' }],
  groups: [{ type: 'group', slug: 'admins', name: 'Admins' }],
};

function repoContextService() {
  return createMockContextService({ workspace: 'acme', repoSlug: 'app' });
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  return rowsLog
    ? (JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][])
    : [];
}

interface ApiCalls {
  list: unknown[];
  listOptions: unknown[];
  get: unknown[];
  post: unknown[];
  delete: unknown[];
}

function createMockApi(
  options: {
    restrictions?: Branchrestriction[];
    notFound?: boolean;
  } = {}
): { api: BranchRestrictionsApi; calls: ApiCalls } {
  const restrictions = options.restrictions ?? [
    globRestriction,
    modelRestriction,
  ];
  const calls: ApiCalls = {
    list: [],
    listOptions: [],
    get: [],
    post: [],
    delete: [],
  };
  const api = {
    repositoriesWorkspaceRepoSlugBranchRestrictionsGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      calls.list.push(request);
      calls.listOptions.push(axiosOptions);
      return { data: { values: restrictions, size: restrictions.length } };
    },
    repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet: async (
      request: unknown
    ) => {
      calls.get.push(request);
      if (options.notFound) throw new APIError('Resource not found', 404);
      return { data: modelRestriction };
    },
    repositoriesWorkspaceRepoSlugBranchRestrictionsPost: async (
      request: unknown
    ) => {
      calls.post.push(request);
      const body = (request as { body: Branchrestriction }).body;
      return { data: { ...body, id: 99 } };
    },
    repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete: async (
      request: unknown
    ) => {
      calls.delete.push(request);
      if (options.notFound) throw new APIError('Resource not found', 404);
      return { data: undefined };
    },
  } as unknown as BranchRestrictionsApi;
  return { api, calls };
}

function createMockUsersApi(uuids: Record<string, string> = {}): UsersApi {
  return {
    usersSelectedUserGet: async (request: { selectedUser: string }) => ({
      data: { type: 'user', uuid: uuids[request.selectedUser] },
    }),
  } as unknown as UsersApi;
}

describe('ListBranchRestrictionsCommand', () => {
  it('renders glob and branching-model matches with values', async () => {
    const output = createMockOutputService();
    const { api } = createMockApi();
    const command = new ListBranchRestrictionsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('table:ID,KIND,BRANCH,VALUE');
    expect(getTableRows(output.logs)).toEqual([
      ['7', 'require_approvals_to_merge', 'main', '2'],
      ['8', 'push', 'production (branching model)', '-'],
    ]);
  });

  it('passes --kind/--pattern filters and pagination to the API', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockApi();
    const command = new ListBranchRestrictionsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute(
      { kind: 'push', pattern: 'main', limit: '10' },
      { globalOptions: {} }
    );

    expect(calls.list[0]).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
      kind: 'push',
      pattern: 'main',
    });
    expect(calls.listOptions[0]).toEqual({ params: { page: 1, pagelen: 10 } });
  });

  it('rejects an unknown --kind before calling the API', async () => {
    const { api, calls } = createMockApi();
    const command = new ListBranchRestrictionsCommand(
      api,
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ kind: 'pushh' }, { globalOptions: {} })
    ).rejects.toThrow('--kind must be one of');
    expect(calls.list).toHaveLength(0);
  });

  it('emits the JSON envelope with filters', async () => {
    const output = createMockOutputService();
    const { api } = createMockApi();
    const command = new ListBranchRestrictionsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({ kind: 'push' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'filters',
      'count',
      'branchRestrictions',
    ]);
    expect(payload.filters).toEqual({ kind: 'push', pattern: null });
    expect(payload.count).toBe(2);
  });

  it('prints an empty-state message', async () => {
    const output = createMockOutputService();
    const { api } = createMockApi({ restrictions: [] });
    const command = new ListBranchRestrictionsCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain(
      'info:No branch restrictions found in acme/app'
    );
  });
});

describe('ViewBranchRestrictionCommand', () => {
  it('renders the rule with its exempt users and groups', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockApi();
    const command = new ViewBranchRestrictionCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({ id: '8' }, { globalOptions: {} });

    expect(calls.get[0]).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
      id: '8',
    });
    expect(output.logs).toContain(
      'text:Branch:      production (branching model)'
    );
    expect(output.logs).toContain('text:  user   Ada');
    expect(output.logs).toContain('text:  group  Admins');
  });

  it('wraps the rule in a JSON envelope', async () => {
    const output = createMockOutputService();
    const { api } = createMockApi();
    const command = new ViewBranchRestrictionCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({ id: '8' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(payload.workspace).toBe('acme');
    expect((payload.branchRestriction as Branchrestriction).id).toBe(8);
  });

  it('rejects a non-numeric id', async () => {
    const { api, calls } = createMockApi();
    const command = new ViewBranchRestrictionCommand(
      api,
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow('must be a positive integer');
    expect(calls.get).toHaveLength(0);
  });

  it('adds repository context to a 404', async () => {
    const { api } = createMockApi({ notFound: true });
    const command = new ViewBranchRestrictionCommand(
      api,
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ id: '5' }, { globalOptions: {} })
    ).rejects.toThrow('Branch restriction 5 not found in acme/app.');
  });
});

describe('CreateBranchRestrictionCommand', () => {
  function makeCommand(
    api: BranchRestrictionsApi,
    usersApi: UsersApi = createMockUsersApi()
  ) {
    const output = createMockOutputService();
    return {
      output,
      command: new CreateBranchRestrictionCommand(
        api,
        usersApi,
        repoContextService(),
        output
      ),
    };
  }

  it('creates a glob rule with a value', async () => {
    const { api, calls } = createMockApi();
    const { command, output } = makeCommand(api);

    await command.execute(
      { kind: 'require_approvals_to_merge', pattern: 'main', value: '2' },
      { globalOptions: {} }
    );

    expect(calls.post[0]).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
      body: {
        type: 'branchrestriction',
        kind: 'require_approvals_to_merge',
        branch_match_kind: 'glob',
        pattern: 'main',
        value: 2,
      },
    });
    expect(output.logs).toContain(
      'success:Created branch restriction 99 (require_approvals_to_merge on main)'
    );
  });

  it('creates a branching-model rule with an empty pattern', async () => {
    const { api, calls } = createMockApi();
    const { command } = makeCommand(api);

    await command.execute(
      { kind: 'delete', branchType: 'release' },
      { globalOptions: {} }
    );

    expect((calls.post[0] as { body: unknown }).body).toEqual({
      type: 'branchrestriction',
      kind: 'delete',
      branch_match_kind: 'branching_model',
      branch_type: 'release',
      pattern: '',
    });
  });

  it('accepts a zero value', async () => {
    const { api, calls } = createMockApi();
    const { command } = makeCommand(api);

    await command.execute(
      { kind: 'require_commits_behind', pattern: 'main', value: '0' },
      { globalOptions: {} }
    );

    expect((calls.post[0] as { body: Branchrestriction }).body.value).toBe(0);
  });

  it('resolves exempt users to UUIDs and attaches groups by slug', async () => {
    const { api, calls } = createMockApi();
    const { command } = makeCommand(
      api,
      createMockUsersApi({ '712020:abc': '{resolved-uuid}' })
    );

    await command.execute(
      {
        kind: 'push',
        pattern: 'main',
        user: ['712020:abc'],
        group: ['admins'],
      },
      { globalOptions: {} }
    );

    const body = (calls.post[0] as { body: Branchrestriction }).body;
    expect(body.users).toEqual([{ type: 'user', uuid: '{resolved-uuid}' }]);
    expect(body.groups).toEqual([{ type: 'group', slug: 'admins' }]);
  });

  it('emits the created rule as JSON', async () => {
    const { api } = createMockApi();
    const { command, output } = makeCommand(api);

    await command.execute(
      { kind: 'force', pattern: 'main' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'branchRestriction',
    ]);
  });

  const invalidCases: Array<[string, Record<string, unknown>, string]> = [
    ['missing --kind', { pattern: 'main' }, 'Option --kind is required'],
    [
      'unknown --kind',
      { kind: 'nope', pattern: 'main' },
      '--kind must be one of',
    ],
    ['no branch selector', { kind: 'force' }, 'One of --pattern or'],
    [
      'both branch selectors',
      { kind: 'force', pattern: 'main', branchType: 'release' },
      'cannot both be set',
    ],
    [
      'unknown --branch-type',
      { kind: 'force', branchType: 'prod' },
      '--branch-type must be one of',
    ],
    [
      'negative --value',
      { kind: 'require_approvals_to_merge', pattern: 'main', value: '-1' },
      'non-negative integer',
    ],
    [
      'exemptions on a non-exemptable kind',
      { kind: 'force', pattern: 'main', group: ['admins'] },
      'only apply to the push and restrict_merges kinds',
    ],
  ];

  for (const [label, options, message] of invalidCases) {
    it(`rejects ${label} before calling the API`, async () => {
      const { api, calls } = createMockApi();
      const { command } = makeCommand(api);

      await expect(
        command.execute(options, { globalOptions: {} })
      ).rejects.toThrow(message);
      expect(calls.post).toHaveLength(0);
    });
  }
});

describe('DeleteBranchRestrictionCommand', () => {
  it('requires --yes', async () => {
    const { api, calls } = createMockApi();
    const command = new DeleteBranchRestrictionCommand(
      api,
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ id: '7' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm');
    expect(calls.delete).toHaveLength(0);
  });

  it('deletes the rule with --yes', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockApi();
    const command = new DeleteBranchRestrictionCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute({ id: '7', yes: true }, { globalOptions: {} });

    expect(calls.delete[0]).toEqual({
      workspace: 'acme',
      repoSlug: 'app',
      id: '7',
    });
    expect(output.logs).toContain('success:Deleted branch restriction 7');
  });

  it('emits a JSON success envelope', async () => {
    const output = createMockOutputService();
    const { api } = createMockApi();
    const command = new DeleteBranchRestrictionCommand(
      api,
      repoContextService(),
      output
    );

    await command.execute(
      { id: '7', yes: true },
      { globalOptions: { json: true } }
    );

    expect(getJsonPayload(output.logs)).toEqual({
      success: true,
      workspace: 'acme',
      repoSlug: 'app',
      id: 7,
    });
  });
});
