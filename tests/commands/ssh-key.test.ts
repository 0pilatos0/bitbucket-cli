/**
 * SSH key command tests
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ListSshKeysCommand } from '../../src/commands/ssh-key/list.command.js';
import { AddSshKeyCommand } from '../../src/commands/ssh-key/add.command.js';
import { DeleteSshKeyCommand } from '../../src/commands/ssh-key/delete.command.js';
import { createMockOutputService, createMockPromptService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type {
  SSHApi,
  SshAccountKey,
  UsersApi,
} from '../../src/generated/api.js';

const sshKey: SshAccountKey = {
  type: 'ssh_key',
  uuid: '{key-1}',
  label: 'laptop',
  fingerprint: 'SHA256:abc',
  created_on: '2026-01-01T00:00:00.000Z',
};

const usersApi = {
  userGet: async () => ({ data: { type: 'user', uuid: '{me}' } }),
} as unknown as UsersApi;

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bb-ssh-key-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

function createMockSshApi(
  options: { keys?: SshAccountKey[]; notFound?: boolean } = {}
): { api: SSHApi; calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = { list: [], post: [], delete: [] };
  const api = {
    usersSelectedUserSshKeysGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      calls.list!.push({ request, axiosOptions });
      return { data: { values: options.keys ?? [sshKey] } };
    },
    usersSelectedUserSshKeysPost: async (request: unknown) => {
      calls.post!.push(request);
      return { data: { ...sshKey, label: 'new' } };
    },
    usersSelectedUserSshKeysKeyIdDelete: async (request: unknown) => {
      calls.delete!.push(request);
      if (options.notFound) throw new APIError('Resource not found', 404);
      return { data: undefined };
    },
  } as unknown as SSHApi;
  return { api, calls };
}

describe('ListSshKeysCommand', () => {
  it('lists keys for the authenticated account', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSshApi();
    const command = new ListSshKeysCommand(api, usersApi, output);

    await command.execute({}, { globalOptions: {} });

    expect(calls.list![0]).toEqual({
      request: { selectedUser: '{me}' },
      axiosOptions: { params: { page: 1, pagelen: 25 } },
    });
    expect(output.logs).toContain(
      'table:UUID,LABEL,FINGERPRINT,CREATED,LAST USED'
    );
    expect(output.logs).toContain(
      `table-rows:${JSON.stringify([['{key-1}', 'laptop', 'SHA256:abc', '2026-01-01T00:00:00.000Z', 'never']])}`
    );
  });

  it('emits { count, sshKeys } as JSON', async () => {
    const output = createMockOutputService();
    const { api } = createMockSshApi();
    const command = new ListSshKeysCommand(api, usersApi, output);

    await command.execute({}, { globalOptions: { json: true } });

    const log = output.logs.find((l) => l.startsWith('json:'))!;
    const payload = JSON.parse(log.slice('json:'.length));
    expect(Object.keys(payload)).toEqual(['count', 'sshKeys']);
    expect(payload.count).toBe(1);
  });

  it('validates --limit before any network call', async () => {
    const { api, calls } = createMockSshApi();
    const command = new ListSshKeysCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await expect(
      command.execute({ limit: '0' }, { globalOptions: {} })
    ).rejects.toThrow('--limit must be a positive integer');
    expect(calls.list).toHaveLength(0);
  });
});

describe('AddSshKeyCommand', () => {
  it('posts the key file contents and label', async () => {
    const path = join(dir, 'id.pub');
    await writeFile(path, 'ssh-ed25519 AAAA me@host\n');
    const output = createMockOutputService();
    const { api, calls } = createMockSshApi();
    const command = new AddSshKeyCommand(api, usersApi, output);

    await command.execute(
      { keyFile: path, label: 'laptop' },
      { globalOptions: {} }
    );

    expect(calls.post![0]).toEqual({
      selectedUser: '{me}',
      body: {
        type: 'ssh_key',
        key: 'ssh-ed25519 AAAA me@host',
        label: 'laptop',
      },
    });
    expect(output.logs).toContain('success:Added SSH key new');
  });

  it('reads the key from stdin for -', async () => {
    const { api, calls } = createMockSshApi();
    class StdinAddSshKeyCommand extends AddSshKeyCommand {
      protected override async readStdin(): Promise<string> {
        return 'ssh-rsa BBBB\n';
      }
    }
    const command = new StdinAddSshKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await command.execute({ keyFile: '-' }, { globalOptions: {} });

    expect((calls.post![0] as { body: unknown }).body).toEqual({
      type: 'ssh_key',
      key: 'ssh-rsa BBBB',
    });
  });

  it('emits the created key as JSON', async () => {
    const path = join(dir, 'json.pub');
    await writeFile(path, 'ssh-ed25519 CCCC');
    const output = createMockOutputService();
    const { api } = createMockSshApi();
    const command = new AddSshKeyCommand(api, usersApi, output);

    await command.execute({ keyFile: path }, { globalOptions: { json: true } });

    const log = output.logs.find((l) => l.startsWith('json:'))!;
    expect(Object.keys(JSON.parse(log.slice('json:'.length)))).toEqual([
      'sshKey',
    ]);
  });
});

describe('DeleteSshKeyCommand', () => {
  it('requires --yes', async () => {
    const { api, calls } = createMockSshApi();
    const command = new DeleteSshKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await expect(
      command.execute({ keyId: '{key-1}' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm');
    expect(calls.delete).toHaveLength(0);
  });

  it('asks for confirmation in an interactive terminal', async () => {
    const prompt = createMockPromptService([true]);
    const { api, calls } = createMockSshApi();
    const command = new DeleteSshKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await command.execute({ keyId: '{key-1}' }, { globalOptions: {}, prompt });

    expect(prompt.calls).toHaveLength(1);
    expect(prompt.calls[0]).toStartWith(
      'confirm:This will permanently delete SSH key {key-1}'
    );
    expect(calls.delete).toHaveLength(1);
  });

  it('deletes the key with --yes', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockSshApi();
    const command = new DeleteSshKeyCommand(api, usersApi, output);

    await command.execute(
      { keyId: '{key-1}', yes: true },
      { globalOptions: {} }
    );

    expect(calls.delete![0]).toEqual({
      selectedUser: '{me}',
      keyId: '{key-1}',
    });
    expect(output.logs).toContain('success:Deleted SSH key {key-1}');
  });

  it('adds context to a 404', async () => {
    const { api } = createMockSshApi({ notFound: true });
    const command = new DeleteSshKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await expect(
      command.execute({ keyId: '{nope}', yes: true }, { globalOptions: {} })
    ).rejects.toThrow('SSH key {nope} not found on your account.');
  });
});
