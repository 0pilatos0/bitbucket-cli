/**
 * Account key helper tests
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readPublicKey,
  resolveCurrentUserUuid,
} from '../../src/services/account-keys.js';
import type { UsersApi } from '../../src/generated/api.js';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bb-account-keys-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const noStdin = async (): Promise<string> => {
  throw new Error('stdin should not be read');
};

describe('readPublicKey', () => {
  it('reads and trims a key file', async () => {
    const path = join(dir, 'id.pub');
    await writeFile(path, 'ssh-ed25519 AAAA me@host\n');

    expect(await readPublicKey(path, noStdin)).toBe('ssh-ed25519 AAAA me@host');
  });

  it('reads stdin for -', async () => {
    expect(await readPublicKey('-', async () => '  ssh-rsa BBBB \n')).toBe(
      'ssh-rsa BBBB'
    );
  });

  it('rejects a missing file with FILE_NOT_FOUND', async () => {
    await expect(
      readPublicKey(join(dir, 'missing.pub'), noStdin)
    ).rejects.toMatchObject({ code: 5003 });
  });

  it('rejects an empty file', async () => {
    const path = join(dir, 'empty.pub');
    await writeFile(path, '\n');

    await expect(readPublicKey(path, noStdin)).rejects.toThrow('is empty');
  });

  it('rejects an OpenSSH private key file before any network call', async () => {
    const path = join(dir, 'id_ed25519');
    await writeFile(
      path,
      '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXkt\n-----END OPENSSH PRIVATE KEY-----\n'
    );

    await expect(readPublicKey(path, noStdin)).rejects.toMatchObject({
      code: 5002,
      message: expect.stringContaining('holds a private key'),
    });
  });

  it('rejects a PEM private key file', async () => {
    const path = join(dir, 'id_rsa');
    await writeFile(
      path,
      '-----BEGIN RSA PRIVATE KEY-----\nMIIE\n-----END RSA PRIVATE KEY-----\n'
    );

    await expect(readPublicKey(path, noStdin)).rejects.toThrow(
      'holds a private key'
    );
  });

  it('rejects a PGP private key block on stdin', async () => {
    await expect(
      readPublicKey(
        '-',
        async () =>
          '-----BEGIN PGP PRIVATE KEY BLOCK-----\n\nlQdG\n-----END PGP PRIVATE KEY BLOCK-----\n'
      )
    ).rejects.toThrow('stdin holds a private key');
  });

  it('accepts a PGP public key block', async () => {
    const block =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQIN\n-----END PGP PUBLIC KEY BLOCK-----';

    expect(await readPublicKey('-', async () => block)).toBe(block);
  });

  it('rejects empty stdin', async () => {
    await expect(readPublicKey('-', async () => '')).rejects.toThrow(
      'No key found on stdin.'
    );
  });
});

describe('resolveCurrentUserUuid', () => {
  it('returns the authenticated account UUID', async () => {
    const usersApi = {
      userGet: async () => ({ data: { type: 'user', uuid: '{me}' } }),
    } as unknown as UsersApi;

    expect(await resolveCurrentUserUuid(usersApi)).toBe('{me}');
  });

  it('fails when GET /user has no UUID', async () => {
    const usersApi = {
      userGet: async () => ({ data: { type: 'user' } }),
    } as unknown as UsersApi;

    await expect(resolveCurrentUserUuid(usersApi)).rejects.toThrow(
      'Could not determine your account UUID'
    );
  });
});
