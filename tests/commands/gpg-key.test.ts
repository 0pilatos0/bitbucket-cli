/**
 * GPG key command tests
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ListGpgKeysCommand } from '../../src/commands/gpg-key/list.command.js';
import { AddGpgKeyCommand } from '../../src/commands/gpg-key/add.command.js';
import { DeleteGpgKeyCommand } from '../../src/commands/gpg-key/delete.command.js';
import { createMockOutputService } from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import type {
  GPGAccountKey,
  GPGApi,
  UsersApi,
} from '../../src/generated/api.js';

const gpgKey: GPGAccountKey = {
  type: 'gpg_key',
  fingerprint: 'ABCDEF0123456789',
  key_id: '0123456789',
  name: 'Ada <ada@example.com>',
  added_on: '2026-01-01T00:00:00.000Z',
};

const usersApi = {
  userGet: async () => ({ data: { type: 'user', uuid: '{me}' } }),
} as unknown as UsersApi;

const ARMORED =
  '-----BEGIN PGP PUBLIC KEY BLOCK-----\nabc\n-----END PGP PUBLIC KEY BLOCK-----';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bb-gpg-key-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

function createMockGpgApi(options: { notFound?: boolean } = {}): {
  api: GPGApi;
  calls: Record<string, unknown[]>;
} {
  const calls: Record<string, unknown[]> = { list: [], post: [], delete: [] };
  const api = {
    usersSelectedUserGpgKeysGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      calls.list!.push({ request, axiosOptions });
      return { data: { values: [gpgKey] } };
    },
    usersSelectedUserGpgKeysPost: async (request: unknown) => {
      calls.post!.push(request);
      return { data: gpgKey };
    },
    usersSelectedUserGpgKeysFingerprintDelete: async (request: unknown) => {
      calls.delete!.push(request);
      if (options.notFound) throw new APIError('Resource not found', 404);
      return { data: undefined };
    },
  } as unknown as GPGApi;
  return { api, calls };
}

describe('ListGpgKeysCommand', () => {
  it('lists keys for the authenticated account', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockGpgApi();
    const command = new ListGpgKeysCommand(api, usersApi, output);

    await command.execute({}, { globalOptions: {} });

    expect((calls.list![0] as { request: unknown }).request).toEqual({
      selectedUser: '{me}',
    });
    expect(output.logs).toContain(
      'table:FINGERPRINT,KEY ID,NAME,ADDED,EXPIRES'
    );
    expect(output.logs).toContain(
      `table-rows:${JSON.stringify([['ABCDEF0123456789', '0123456789', 'Ada <ada@example.com>', '2026-01-01T00:00:00.000Z', 'never']])}`
    );
  });

  it('emits { count, gpgKeys } as JSON', async () => {
    const output = createMockOutputService();
    const { api } = createMockGpgApi();
    const command = new ListGpgKeysCommand(api, usersApi, output);

    await command.execute({}, { globalOptions: { json: true } });

    const log = output.logs.find((l) => l.startsWith('json:'))!;
    expect(Object.keys(JSON.parse(log.slice('json:'.length)))).toEqual([
      'count',
      'gpgKeys',
    ]);
  });
});

describe('AddGpgKeyCommand', () => {
  it('posts the armored key from a file', async () => {
    const path = join(dir, 'key.asc');
    await writeFile(path, `${ARMORED}\n`);
    const output = createMockOutputService();
    const { api, calls } = createMockGpgApi();
    const command = new AddGpgKeyCommand(api, usersApi, output);

    await command.execute({ keyFile: path }, { globalOptions: {} });

    expect(calls.post![0]).toEqual({
      selectedUser: '{me}',
      body: { type: 'gpg_key', key: ARMORED },
    });
    expect(output.logs).toContain('success:Added GPG key ABCDEF0123456789');
  });

  it('reads the key from stdin for -', async () => {
    const { api, calls } = createMockGpgApi();
    class StdinAddGpgKeyCommand extends AddGpgKeyCommand {
      protected override async readStdin(): Promise<string> {
        return ARMORED;
      }
    }
    const command = new StdinAddGpgKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await command.execute({ keyFile: '-' }, { globalOptions: {} });

    expect((calls.post![0] as { body: { key: string } }).body.key).toBe(
      ARMORED
    );
  });
});

describe('DeleteGpgKeyCommand', () => {
  it('requires --yes', async () => {
    const { api, calls } = createMockGpgApi();
    const command = new DeleteGpgKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await expect(
      command.execute({ fingerprint: 'ABC' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm');
    expect(calls.delete).toHaveLength(0);
  });

  it('deletes the key with --yes and reports JSON', async () => {
    const output = createMockOutputService();
    const { api, calls } = createMockGpgApi();
    const command = new DeleteGpgKeyCommand(api, usersApi, output);

    await command.execute(
      { fingerprint: 'ABC', yes: true },
      { globalOptions: { json: true } }
    );

    expect(calls.delete![0]).toEqual({
      selectedUser: '{me}',
      fingerprint: 'ABC',
    });
    expect(output.logs).toContain(
      `json:${JSON.stringify({ success: true, fingerprint: 'ABC' })}`
    );
  });

  it('adds context to a 404', async () => {
    const { api } = createMockGpgApi({ notFound: true });
    const command = new DeleteGpgKeyCommand(
      api,
      usersApi,
      createMockOutputService()
    );

    await expect(
      command.execute({ fingerprint: 'ABC', yes: true }, { globalOptions: {} })
    ).rejects.toThrow('GPG key ABC not found on your account.');
  });
});
