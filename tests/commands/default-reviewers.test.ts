/**
 * Repo default-reviewers command tests.
 */

import { describe, it, expect } from 'bun:test';
import { ListDefaultReviewersCommand } from '../../src/commands/repo/default-reviewers.list.command.js';
import { AddDefaultReviewerCommand } from '../../src/commands/repo/default-reviewers.add.command.js';
import { RemoveDefaultReviewerCommand } from '../../src/commands/repo/default-reviewers.remove.command.js';
import type {
  DefaultReviewerEntry,
  DefaultReviewerService,
} from '../../src/services/default-reviewer.service.js';
import type { IContextService } from '../../src/core/interfaces/services.js';
import type { UsersApi } from '../../src/generated/api.js';
import { createMockOutputService, mockUser } from '../setup.js';

function createMockUsersApi(): UsersApi {
  const api = {
    async userGet() {
      return {
        data: mockUser,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };
    },
    async usersSelectedUserGet(params: { selectedUser: string }) {
      return {
        data: {
          ...mockUser,
          uuid: `{${params.selectedUser}-uuid}`,
          display_name: `Display ${params.selectedUser}`,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };
    },
  };
  return api as unknown as UsersApi;
}

function createMockService(
  overrides: Partial<DefaultReviewerService> & {
    entries?: DefaultReviewerEntry[];
    addResult?: DefaultReviewerEntry;
    removeCalls?: string[];
    addCalls?: string[];
  } = {}
): DefaultReviewerService {
  const addCalls = overrides.addCalls ?? [];
  const removeCalls = overrides.removeCalls ?? [];

  const svc = {
    async list() {
      return overrides.entries ?? [];
    },
    async add(_repo: unknown, username: string) {
      addCalls.push(username);
      return (
        overrides.addResult ?? {
          uuid: `{${username}-uuid}`,
          displayName: `Display ${username}`,
        }
      );
    },
    async remove(_repo: unknown, username: string) {
      removeCalls.push(username);
    },
  };

  return svc as unknown as DefaultReviewerService;
}

function createContextService(): IContextService {
  return {
    parseRemoteUrl() {
      return null;
    },
    async getRepoContextFromGit() {
      return null;
    },
    async getRepoContext() {
      return { workspace: 'ws', repoSlug: 'repo' };
    },
    async requireRepoContext() {
      return { workspace: 'ws', repoSlug: 'repo' };
    },
  };
}

describe('ListDefaultReviewersCommand', () => {
  it('prints an info message when empty', async () => {
    const output = createMockOutputService();
    const cmd = new ListDefaultReviewersCommand(
      createMockService({ entries: [] }),
      createContextService(),
      output
    );

    await cmd.execute({}, { globalOptions: {} });

    expect(output.logs.some((l) => l.startsWith('info:'))).toBe(true);
  });

  it('renders a table with a Source column for effective mode', async () => {
    const output = createMockOutputService();
    const cmd = new ListDefaultReviewersCommand(
      createMockService({
        entries: [
          {
            uuid: '{a}',
            displayName: 'Alice',
            nickname: 'alice',
            reviewerType: 'repository',
          },
        ],
      }),
      createContextService(),
      output
    );

    await cmd.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((l) => l === 'table:Display Name,Nickname,Source')
    ).toBe(true);
  });

  it('renders a table without Source column for --repo-only', async () => {
    const output = createMockOutputService();
    const cmd = new ListDefaultReviewersCommand(
      createMockService({
        entries: [{ uuid: '{a}', displayName: 'Alice', nickname: 'alice' }],
      }),
      createContextService(),
      output
    );

    await cmd.execute({ repoOnly: true }, { globalOptions: {} });

    expect(output.logs.some((l) => l === 'table:Display Name,Nickname')).toBe(
      true
    );
  });

  it('outputs JSON when requested', async () => {
    const output = createMockOutputService();
    const cmd = new ListDefaultReviewersCommand(
      createMockService({
        entries: [{ uuid: '{a}', displayName: 'Alice' }],
      }),
      createContextService(),
      output
    );

    await cmd.execute({}, { globalOptions: { json: true } });

    expect(output.logs.some((l) => l.startsWith('json:'))).toBe(true);
  });
});

describe('AddDefaultReviewerCommand', () => {
  it('adds the user via the service and reports success', async () => {
    const addCalls: string[] = [];
    const output = createMockOutputService();
    const cmd = new AddDefaultReviewerCommand(
      createMockService({ addCalls }),
      createMockUsersApi(),
      createContextService(),
      output
    );

    await cmd.execute({ username: 'jdoe' }, { globalOptions: {} });

    expect(addCalls).toEqual(['{jdoe-uuid}']);
    expect(
      output.logs.some((l) => l.startsWith('success:') && l.includes('jdoe'))
    ).toBe(true);
  });
});

describe('RemoveDefaultReviewerCommand', () => {
  it('refuses without --yes', async () => {
    const removeCalls: string[] = [];
    const output = createMockOutputService();
    const cmd = new RemoveDefaultReviewerCommand(
      createMockService({ removeCalls }),
      createMockUsersApi(),
      createContextService(),
      output
    );

    await expect(
      cmd.execute({ username: 'jdoe' }, { globalOptions: {} })
    ).rejects.toThrow(/--yes/);
    expect(removeCalls).toEqual([]);
  });

  it('removes when --yes is passed', async () => {
    const removeCalls: string[] = [];
    const output = createMockOutputService();
    const cmd = new RemoveDefaultReviewerCommand(
      createMockService({ removeCalls }),
      createMockUsersApi(),
      createContextService(),
      output
    );

    await cmd.execute({ username: 'jdoe', yes: true }, { globalOptions: {} });

    expect(removeCalls).toEqual(['{jdoe-uuid}']);
    expect(output.logs.some((l) => l.startsWith('success:'))).toBe(true);
  });
});
