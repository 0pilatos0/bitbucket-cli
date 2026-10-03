/**
 * CredentialStore tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '../../src/services/config.service.js';
import { CredentialStore } from '../../src/services/credential-store.service.js';
import { KeychainSecretStorage } from '../../src/services/keychain.js';
import type { ISecretStorage } from '../../src/core/interfaces/services.js';
import { ErrorCode } from '../../src/types/errors.js';
import type { BBConfig } from '../../src/types/config.js';
import { createMockSecretStorage } from '../setup.js';

const FUTURE = Math.floor(Date.now() / 1000) + 3600;

describe('CredentialStore', () => {
  let configDir: string;
  let configService: ConfigService;
  let secrets: ReturnType<typeof createMockSecretStorage>;

  function createStore(
    env: NodeJS.ProcessEnv = {},
    keychain: ISecretStorage = secrets
  ): CredentialStore {
    return new CredentialStore(configService, keychain, env);
  }

  async function writeConfig(config: BBConfig): Promise<void> {
    await mkdir(configDir, { recursive: true, mode: 0o700 });
    await writeFile(join(configDir, 'config.json'), JSON.stringify(config), {
      mode: 0o600,
    });
  }

  async function readConfigFile(): Promise<BBConfig> {
    return JSON.parse(
      await readFile(join(configDir, 'config.json'), 'utf-8')
    ) as BBConfig;
  }

  beforeEach(() => {
    configDir = join(
      tmpdir(),
      `bb-credstore-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    configService = new ConfigService(configDir);
    secrets = createMockSecretStorage();
  });

  afterEach(async () => {
    await rm(configDir, { recursive: true, force: true });
  });

  describe('basic auth', () => {
    it('round-trips credentials under the default account', async () => {
      const store = createStore();
      expect(await store.getAuthMethod()).toBe('basic');
      expect(await store.hasCredentials()).toBe(false);

      await store.setCredentials({ username: 'alice', apiToken: 't' });

      expect(await store.getCredentials()).toEqual({
        username: 'alice',
        apiToken: 't',
      });
      expect(await store.hasCredentials()).toBe(true);
      expect((await readConfigFile()).accounts).toEqual({
        default: { authMethod: 'basic', username: 'alice', apiToken: 't' },
      });
    });

    it('removes the account once its credentials are cleared', async () => {
      const store = createStore();
      await store.setCredentials({ username: 'alice', apiToken: 't' });

      await store.clearCredentials();

      expect(await store.listAccounts()).toEqual([]);
      await expect(store.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
        message: "Authentication required. Run 'bb auth login'.",
      });
    });

    it('keeps app config when writing credentials', async () => {
      await configService.setValue('defaultWorkspace', 'acme');
      await createStore().setCredentials({ username: 'u', apiToken: 't' });

      expect((await readConfigFile()).defaultWorkspace).toBe('acme');
    });
  });

  describe('OAuth', () => {
    it('round-trips tokens and replaces basic credentials', async () => {
      const store = createStore();
      await store.setCredentials({ username: 'alice', apiToken: 't' });

      await store.setOAuthCredentials({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: FUTURE,
      });

      expect(await store.getAuthMethod()).toBe('oauth');
      expect(await store.isOAuthTokenExpired()).toBe(false);
      expect(await store.getOAuthCredentials()).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: FUTURE,
      });
      await expect(store.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('keeps the custom consumer across token refreshes', async () => {
      const store = createStore();
      const tokens = {
        accessToken: 'a',
        refreshToken: 'r',
        expiresAt: FUTURE,
      };
      await store.setOAuthCredentials(tokens, {
        clientId: 'id',
        clientSecret: 'secret',
      });
      await store.setOAuthCredentials({ ...tokens, accessToken: 'a2' });

      expect(await store.getOAuthClient()).toEqual({
        clientId: 'id',
        clientSecret: 'secret',
      });
    });

    it('treats tokens within 60 seconds of expiry as expired', async () => {
      const store = createStore();
      expect(await store.isOAuthTokenExpired()).toBe(true);

      await store.setOAuthCredentials({
        accessToken: 'a',
        refreshToken: 'r',
        expiresAt: Math.floor(Date.now() / 1000) + 30,
      });

      expect(await store.isOAuthTokenExpired()).toBe(true);
    });

    it('clears tokens and the consumer together', async () => {
      const store = createStore();
      await store.setOAuthCredentials(
        { accessToken: 'a', refreshToken: 'r', expiresAt: FUTURE },
        { clientId: 'id' }
      );

      await store.clearOAuthCredentials();

      expect(await store.getOAuthClient()).toEqual({
        clientId: undefined,
        clientSecret: undefined,
      });
      expect(await store.listAccounts()).toEqual([]);
    });
  });

  describe('migrating a single-account config', () => {
    const legacy: BBConfig = {
      username: 'alice',
      apiToken: 'legacy-token',
      authMethod: 'basic',
      defaultWorkspace: 'acme',
    };

    it('reads top-level credentials as the default account without rewriting', async () => {
      await writeConfig(legacy);
      const store = createStore();

      expect(await store.getAccountName()).toBe('default');
      expect(await store.getCredentials()).toEqual({
        username: 'alice',
        apiToken: 'legacy-token',
      });
      expect(await readConfigFile()).toEqual(legacy);
    });

    it('moves top-level credentials into accounts on the first write', async () => {
      await writeConfig({
        authMethod: 'oauth',
        oauthAccessToken: 'old',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: FUTURE,
        oauthClientId: 'custom-id',
        defaultWorkspace: 'acme',
      });
      const store = createStore();

      await store.setOAuthCredentials({
        accessToken: 'new',
        refreshToken: 'refresh2',
        expiresAt: FUTURE,
      });

      expect(await readConfigFile()).toEqual({
        defaultWorkspace: 'acme',
        activeAccount: 'default',
        accounts: {
          default: {
            authMethod: 'oauth',
            oauthAccessToken: 'new',
            oauthRefreshToken: 'refresh2',
            oauthExpiresAt: FUTURE,
            oauthClientId: 'custom-id',
          },
        },
      });
    });

    it('lets credentials written by an older bb win over the stored default', async () => {
      await writeConfig({
        accounts: { default: { username: 'stale', apiToken: 'stale' } },
        username: 'fresh',
        apiToken: 'fresh-token',
      });

      expect(await createStore().getCredentials()).toEqual({
        username: 'fresh',
        apiToken: 'fresh-token',
      });
    });
  });

  describe('accounts', () => {
    async function seedTwoAccounts(): Promise<void> {
      const store = createStore();
      await store.setCredentials({ username: 'work@x.com', apiToken: 'w' });
      await store.switchAccount('default');
      store.useAccount('personal');
      await store.setCredentials({ username: 'me@y.com', apiToken: 'p' });
    }

    it('uses the persisted active account by default', async () => {
      await seedTwoAccounts();

      const store = createStore();
      expect(await store.getAccountName()).toBe('default');
      expect((await store.getCredentials()).username).toBe('work@x.com');

      await store.switchAccount('personal');

      const fresh = createStore();
      expect(await fresh.getAccountName()).toBe('personal');
      expect((await fresh.getCredentials()).username).toBe('me@y.com');
    });

    it('prefers useAccount over BB_ACCOUNT over the active account', async () => {
      await seedTwoAccounts();

      const fromEnv = createStore({ BB_ACCOUNT: 'personal' });
      expect((await fromEnv.getCredentials()).username).toBe('me@y.com');

      fromEnv.useAccount('default');
      expect((await fromEnv.getCredentials()).username).toBe('work@x.com');
    });

    it('lists accounts with the active one marked', async () => {
      await seedTwoAccounts();

      expect(await createStore().listAccounts()).toEqual([
        {
          name: 'default',
          active: true,
          current: true,
          authMethod: 'basic',
          username: 'work@x.com',
          storage: 'file',
        },
        {
          name: 'personal',
          active: false,
          current: false,
          authMethod: 'basic',
          username: 'me@y.com',
          storage: 'file',
        },
      ]);
    });

    it('rejects switching to an unknown account and names the known ones', async () => {
      await seedTwoAccounts();

      await expect(createStore().switchAccount('nope')).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_INVALID,
        message: "No account named 'nope'. Known accounts: default, personal.",
      });
    });

    it('points at the named account when its credentials are missing', async () => {
      const store = createStore({ BB_ACCOUNT: 'ci' });

      await expect(store.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
        message:
          "Authentication required. No credentials for account 'ci'. Run 'bb auth login --account ci'.",
      });
    });

    it.each(['__proto__', '-x', 'a b', ''])(
      'rejects the account name %p',
      async (name) => {
        const store = createStore();
        store.useAccount(name);

        await expect(store.getAccountName()).rejects.toMatchObject({
          code: ErrorCode.VALIDATION_INVALID,
        });
      }
    );
  });

  describe('keychain storage', () => {
    it('keeps secrets out of the config file', async () => {
      await configService.setValue('credentialStorage', 'keychain');
      const store = createStore();

      await store.setOAuthCredentials(
        { accessToken: 'a', refreshToken: 'r', expiresAt: FUTURE },
        { clientId: 'id', clientSecret: 'cs' }
      );

      expect((await readConfigFile()).accounts).toEqual({
        default: {
          authMethod: 'oauth',
          oauthExpiresAt: FUTURE,
          oauthClientId: 'id',
          storage: 'keychain',
        },
      });
      expect(JSON.parse(secrets.entries.get('default') ?? '{}')).toEqual({
        oauthAccessToken: 'a',
        oauthRefreshToken: 'r',
        oauthClientSecret: 'cs',
      });
      expect((await createStore().getOAuthCredentials()).accessToken).toBe('a');
    });

    it('moves every account into the keychain and back', async () => {
      const store = createStore();
      await store.setCredentials({ username: 'u', apiToken: 'secret-1' });
      store.useAccount('other');
      await store.setCredentials({ username: 'v', apiToken: 'secret-2' });

      expect(await store.setStorage('keychain')).toBe(2);
      const inKeychain = await readFile(
        join(configDir, 'config.json'),
        'utf-8'
      );
      expect(inKeychain).not.toContain('secret-');
      expect(secrets.entries.size).toBe(2);
      expect((await readConfigFile()).credentialStorage).toBe('keychain');
      expect((await createStore().getCredentials()).apiToken).toBe('secret-1');

      expect(await store.setStorage('file')).toBe(2);
      expect(secrets.entries.size).toBe(0);
      expect((await readConfigFile()).accounts?.other?.apiToken).toBe(
        'secret-2'
      );
    });

    it('deletes the keychain entry when the account logs out', async () => {
      await configService.setValue('credentialStorage', 'keychain');
      const store = createStore();
      await store.setCredentials({ username: 'u', apiToken: 't' });

      await store.clearCredentials();

      expect(secrets.entries.size).toBe(0);
    });

    it('leaves file secrets in place when the keychain write fails', async () => {
      const store = createStore(
        {},
        {
          ...secrets,
          async set() {
            throw new Error('keychain locked');
          },
        }
      );
      await store.setCredentials({ username: 'u', apiToken: 't' });

      await expect(store.setStorage('keychain')).rejects.toThrow(
        'keychain locked'
      );

      const config = await readConfigFile();
      expect(config.accounts?.default?.apiToken).toBe('t');
      expect(config.credentialStorage).toBeUndefined();
    });

    it('keeps a moved account in the keychain after a partial move', async () => {
      const store = createStore(
        {},
        {
          ...secrets,
          async set(account, value) {
            if (account === 'other') throw new Error('keychain locked');
            await secrets.set(account, value);
          },
        }
      );
      await store.setCredentials({ username: 'u', apiToken: 'secret-1' });
      store.useAccount('other');
      await store.setCredentials({ username: 'v', apiToken: 'secret-2' });
      await expect(store.setStorage('keychain')).rejects.toThrow();

      store.useAccount('default');
      await store.setCredentials({ username: 'u', apiToken: 'rotated' });

      expect(
        await readFile(join(configDir, 'config.json'), 'utf-8')
      ).not.toContain('rotated');
      expect(secrets.entries.get('default')).toContain('rotated');
    });

    it('logs out without reading an unreadable keychain', async () => {
      await configService.setValue('credentialStorage', 'keychain');
      await createStore().setCredentials({ username: 'u', apiToken: 't' });
      const store = createStore(
        {},
        {
          ...secrets,
          async get() {
            throw new Error('keychain locked');
          },
        }
      );

      await store.clearCredentials();

      expect(await store.listAccounts()).toEqual([]);
      expect(secrets.entries.size).toBe(0);
    });

    it('keeps the account when its keychain entry cannot be deleted, so logout can be retried', async () => {
      await configService.setValue('credentialStorage', 'keychain');
      await createStore().setCredentials({ username: 'u', apiToken: 't' });
      const failing = createStore(
        {},
        {
          ...secrets,
          async delete() {
            throw new Error('keychain locked');
          },
        }
      );

      await expect(failing.clearCredentials()).rejects.toThrow(
        'keychain locked'
      );
      expect((await readConfigFile()).accounts?.default?.storage).toBe(
        'keychain'
      );

      await createStore().clearCredentials();
      expect(secrets.entries.size).toBe(0);
    });
  });

  it('does not overwrite an account another process saved meanwhile', async () => {
    const work = createStore({ BB_ACCOUNT: 'work' });
    const personal = new CredentialStore(
      new ConfigService(configDir),
      secrets,
      { BB_ACCOUNT: 'personal' }
    );
    await work.setCredentials({ username: 'w', apiToken: 'w1' });
    expect(await personal.hasCredentials()).toBe(false);

    await work.setCredentials({ username: 'w', apiToken: 'w2' });
    await personal.setCredentials({ username: 'p', apiToken: 'p1' });

    const { accounts } = await readConfigFile();
    expect(accounts?.work?.apiToken).toBe('w2');
    expect(accounts?.personal?.apiToken).toBe('p1');
  });
});

describe('KeychainSecretStorage', () => {
  it('uses the bitbucket-cli service name', async () => {
    const calls: unknown[] = [];
    const fake = {
      get: async (options: unknown) => {
        calls.push(options);
        return 'value';
      },
      set: async (options: unknown) => {
        calls.push(options);
      },
      delete: async (options: unknown) => {
        calls.push(options);
        return true;
      },
    } as unknown as typeof Bun.secrets;
    const storage = new KeychainSecretStorage(fake);

    expect(await storage.get('work')).toBe('value');
    await storage.set('work', 'secret');
    await storage.delete('work');

    expect(calls).toEqual([
      { service: 'bitbucket-cli', name: 'work' },
      { service: 'bitbucket-cli', name: 'work', value: 'secret' },
      { service: 'bitbucket-cli', name: 'work' },
    ]);
  });

  it('explains how to fall back when the keychain fails', async () => {
    const fake = {
      set: async () => {
        throw new Error('no secret service');
      },
    } as unknown as typeof Bun.secrets;

    await expect(
      new KeychainSecretStorage(fake).set('work', 'x')
    ).rejects.toMatchObject({
      code: ErrorCode.CONFIG_WRITE_FAILED,
      message:
        "Failed to write the OS keychain: no secret service. Run 'bb config set credentialStorage file' to keep credentials in the config file instead.",
    });
  });

  it('asks to unlock the keychain when a read fails', async () => {
    const fake = {
      get: async () => {
        throw new Error('locked');
      },
    } as unknown as typeof Bun.secrets;

    await expect(
      new KeychainSecretStorage(fake).get('work')
    ).rejects.toMatchObject({
      code: ErrorCode.CONFIG_READ_FAILED,
      message:
        'Failed to read the OS keychain: locked. Make sure the OS keychain is unlocked and reachable, then try again.',
    });
  });

  it('reports a runtime without Bun.secrets', async () => {
    await expect(
      new KeychainSecretStorage(null).get('work')
    ).rejects.toMatchObject({
      code: ErrorCode.CONFIG_READ_FAILED,
      message: expect.stringContaining('Bun 1.2.21 or newer'),
    });
  });
});
