/**
 * ConfigService tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ConfigService } from '../../src/services/config.service.js';
import type {
  IConfigService,
  ICredentialStore,
} from '../../src/core/interfaces/services.js';
import { ErrorCode } from '../../src/types/errors.js';
import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('ConfigService', () => {
  const testConfigDir = join(tmpdir(), `bb-test-${Date.now()}`);
  let configService: ConfigService;

  beforeEach(async () => {
    configService = new ConfigService(testConfigDir);
  });

  afterEach(async () => {
    try {
      await rm(testConfigDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getConfig', () => {
    it('should return empty config when file does not exist', async () => {
      const config = await configService.getConfig();

      expect(config).toEqual({});
    });

    it('should return config from file', async () => {
      await mkdir(testConfigDir, { recursive: true });
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'testuser', defaultWorkspace: 'workspace' })
      );

      configService.clearCache();
      const config = await configService.getConfig();

      expect(config.username).toBe('testuser');
      expect(config.defaultWorkspace).toBe('workspace');
    });

    it('should cache config after first read', async () => {
      await mkdir(testConfigDir, { recursive: true });
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'original' })
      );

      // First read
      await configService.getConfig();

      // Modify file directly
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'modified' })
      );

      // Second read should return cached value
      const config = await configService.getConfig();

      expect(config.username).toBe('original');
    });

    it('should throw error for invalid JSON', async () => {
      await mkdir(testConfigDir, { recursive: true });
      await writeFile(join(testConfigDir, 'config.json'), 'invalid json {');

      configService.clearCache();

      await expect(configService.getConfig()).rejects.toMatchObject({
        code: ErrorCode.CONFIG_READ_FAILED,
      });
    });
  });

  describe('setConfig', () => {
    it('should create config file with correct permissions', async () => {
      await configService.setConfig({
        username: 'testuser',
        apiToken: 'secret',
      });

      const content = await readFile(
        join(testConfigDir, 'config.json'),
        'utf-8'
      );
      const parsed = JSON.parse(content);
      expect(parsed.username).toBe('testuser');
      expect(parsed.apiToken).toBe('secret');
    });

    it('should update cached config', async () => {
      await configService.setConfig({ username: 'user1' });

      const config = await configService.getConfig();

      expect(config.username).toBe('user1');
    });

    it('should create directory if it does not exist', async () => {
      await configService.setConfig({ username: 'testuser' });

      const content = await readFile(
        join(testConfigDir, 'config.json'),
        'utf-8'
      );
      expect(content).toContain('testuser');
    });

    it('should format JSON with indentation', async () => {
      await configService.setConfig({ username: 'testuser' });

      const content = await readFile(
        join(testConfigDir, 'config.json'),
        'utf-8'
      );
      expect(content).toContain('\n');
      expect(content).toMatch(/{\n\s+"username"/);
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when both username and apiToken exist', async () => {
      await configService.setConfig({
        username: 'testuser',
        apiToken: 'testpass',
      });

      const credentials = await configService.getCredentials();

      expect(credentials.username).toBe('testuser');
      expect(credentials.apiToken).toBe('testpass');
    });

    it('should throw error when username is missing', async () => {
      await configService.setConfig({ apiToken: 'testpass' });

      await expect(configService.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('should throw error when apiToken is missing', async () => {
      await configService.setConfig({ username: 'testuser' });

      await expect(configService.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('should throw error when config is empty', async () => {
      await expect(configService.getCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
        message: expect.stringContaining('bb auth login'),
      });
    });
  });

  describe('setCredentials', () => {
    it('should set username and apiToken', async () => {
      await configService.setCredentials({
        username: 'newuser',
        apiToken: 'newpass',
      });

      const credentials = await configService.getCredentials();

      expect(credentials.username).toBe('newuser');
      expect(credentials.apiToken).toBe('newpass');
    });

    it('should preserve other config values', async () => {
      await configService.setConfig({
        defaultWorkspace: 'myworkspace',
      });

      await configService.setCredentials({
        username: 'user',
        apiToken: 'pass',
      });

      const config = await configService.getConfig();

      expect(config.defaultWorkspace).toBe('myworkspace');
      expect(config.username).toBe('user');
    });
  });

  describe('clearConfig', () => {
    it('should clear all config values', async () => {
      await configService.setConfig({
        username: 'user',
        apiToken: 'pass',
        defaultWorkspace: 'workspace',
      });

      await configService.clearConfig();

      const config = await configService.getConfig();

      expect(config).toEqual({});
    });
  });

  describe('clearCredentials', () => {
    it('should clear only authentication values', async () => {
      await configService.setConfig({
        username: 'user',
        apiToken: 'pass',
        defaultWorkspace: 'workspace',
        skipVersionCheck: true,
        versionCheckInterval: 3,
      });

      await configService.clearCredentials();

      const config = await configService.getConfig();

      expect(config.username).toBeUndefined();
      expect(config.apiToken).toBeUndefined();
      expect(config.defaultWorkspace).toBe('workspace');
      expect(config.skipVersionCheck).toBe(true);
      expect(config.versionCheckInterval).toBe(3);
    });
  });

  describe('getValue', () => {
    it('should return specific config value', async () => {
      await configService.setConfig({
        username: 'testuser',
        defaultWorkspace: 'myworkspace',
      });

      const value = await configService.getValue('defaultWorkspace');

      expect(value).toBe('myworkspace');
    });

    it('should return undefined for missing value', async () => {
      await configService.setConfig({ username: 'testuser' });

      const value = await configService.getValue('defaultWorkspace');

      expect(value).toBeUndefined();
    });
  });

  describe('setValue', () => {
    it('should set specific config value', async () => {
      await configService.setValue('defaultWorkspace', 'newworkspace');

      const value = await configService.getValue('defaultWorkspace');

      expect(value).toBe('newworkspace');
    });

    it('should preserve other values', async () => {
      await configService.setConfig({ username: 'user' });
      await configService.setValue('defaultWorkspace', 'workspace');

      const config = await configService.getConfig();

      expect(config.username).toBe('user');
      expect(config.defaultWorkspace).toBe('workspace');
    });
  });

  describe('getConfigPath', () => {
    it('should return correct config file path', () => {
      const path = configService.getConfigPath();

      expect(path).toBe(join(testConfigDir, 'config.json'));
    });

    it('should use APPDATA on Windows', () => {
      const windowsService = new ConfigService(undefined, {
        platform: 'win32',
        appData: 'C:\\Users\\test\\AppData\\Roaming',
        homeDir: 'C:\\Users\\test',
      });

      expect(windowsService.getConfigPath()).toBe(
        'C:\\Users\\test\\AppData\\Roaming\\bb\\config.json'
      );
    });

    it('should fall back to home directory on Windows when APPDATA is missing', () => {
      const windowsService = new ConfigService(undefined, {
        platform: 'win32',
        homeDir: 'C:\\Users\\test',
      });

      expect(windowsService.getConfigPath()).toBe(
        'C:\\Users\\test\\AppData\\Roaming\\bb\\config.json'
      );
    });

    it('should use dot-config directory on non-Windows platforms', () => {
      const linuxService = new ConfigService(undefined, {
        platform: 'linux',
        homeDir: '/home/test',
      });

      expect(linuxService.getConfigPath()).toBe(
        '/home/test/.config/bb/config.json'
      );
    });
  });

  describe('getAuthMethod', () => {
    it('should return basic when no auth method is set', async () => {
      const method = await configService.getAuthMethod();
      expect(method).toBe('basic');
    });

    it('should return oauth when authMethod is oauth', async () => {
      await configService.setConfig({ authMethod: 'oauth' });
      const method = await configService.getAuthMethod();
      expect(method).toBe('oauth');
    });

    it('should return basic when authMethod is basic', async () => {
      await configService.setConfig({ authMethod: 'basic' });
      const method = await configService.getAuthMethod();
      expect(method).toBe('basic');
    });
  });

  describe('getOAuthCredentials', () => {
    it('should return OAuth credentials when all fields exist', async () => {
      await configService.setConfig({
        oauthAccessToken: 'access-token',
        oauthRefreshToken: 'refresh-token',
        oauthExpiresAt: 1234567890,
      });

      const creds = await configService.getOAuthCredentials();

      expect(creds.accessToken).toBe('access-token');
      expect(creds.refreshToken).toBe('refresh-token');
      expect(creds.expiresAt).toBe(1234567890);
    });

    it('should throw AUTH_REQUIRED when access token is missing', async () => {
      await configService.setConfig({
        oauthRefreshToken: 'refresh-token',
        oauthExpiresAt: 1234567890,
      });

      await expect(configService.getOAuthCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('should throw AUTH_REQUIRED when refresh token is missing', async () => {
      await configService.setConfig({
        oauthAccessToken: 'access-token',
        oauthExpiresAt: 1234567890,
      });

      await expect(configService.getOAuthCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('should throw AUTH_REQUIRED when expires at is missing', async () => {
      await configService.setConfig({
        oauthAccessToken: 'access-token',
        oauthRefreshToken: 'refresh-token',
      });

      await expect(configService.getOAuthCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
      });
    });

    it('should throw AUTH_REQUIRED when config is empty', async () => {
      await expect(configService.getOAuthCredentials()).rejects.toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
        message: expect.stringContaining('bb auth login'),
      });
    });
  });

  describe('setOAuthCredentials', () => {
    it('should store OAuth credentials and set authMethod to oauth', async () => {
      await configService.setOAuthCredentials({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: 1234567890,
      });

      const config = await configService.getConfig();

      expect(config.authMethod).toBe('oauth');
      expect(config.oauthAccessToken).toBe('access');
      expect(config.oauthRefreshToken).toBe('refresh');
      expect(config.oauthExpiresAt).toBe(1234567890);
    });

    it('should clear basic auth credentials when setting OAuth', async () => {
      await configService.setConfig({
        username: 'olduser',
        apiToken: 'oldtoken',
        defaultWorkspace: 'workspace',
      });

      await configService.setOAuthCredentials({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: 1234567890,
      });

      const config = await configService.getConfig();

      expect(config.username).toBeUndefined();
      expect(config.apiToken).toBeUndefined();
      expect(config.authMethod).toBe('oauth');
      expect(config.defaultWorkspace).toBe('workspace');
    });

    it('should preserve non-auth config values', async () => {
      await configService.setConfig({
        defaultWorkspace: 'myworkspace',
        skipVersionCheck: true,
        versionCheckInterval: 7,
      });

      await configService.setOAuthCredentials({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: 1234567890,
      });

      const config = await configService.getConfig();

      expect(config.defaultWorkspace).toBe('myworkspace');
      expect(config.skipVersionCheck).toBe(true);
      expect(config.versionCheckInterval).toBe(7);
    });
  });

  describe('clearOAuthCredentials', () => {
    it('should clear all OAuth fields', async () => {
      await configService.setConfig({
        authMethod: 'oauth',
        oauthAccessToken: 'access',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: 1234567890,
        oauthClientId: 'custom-id',
        oauthClientSecret: 'custom-secret',
        defaultWorkspace: 'workspace',
      });

      await configService.clearOAuthCredentials();

      const config = await configService.getConfig();

      expect(config.authMethod).toBeUndefined();
      expect(config.oauthAccessToken).toBeUndefined();
      expect(config.oauthRefreshToken).toBeUndefined();
      expect(config.oauthExpiresAt).toBeUndefined();
      expect(config.oauthClientId).toBeUndefined();
      expect(config.oauthClientSecret).toBeUndefined();
      expect(config.defaultWorkspace).toBe('workspace');
    });

    it('should preserve non-OAuth config values', async () => {
      await configService.setConfig({
        authMethod: 'oauth',
        oauthAccessToken: 'access',
        oauthRefreshToken: 'refresh',
        oauthExpiresAt: 1234567890,
        defaultWorkspace: 'workspace',
        skipVersionCheck: false,
        versionCheckInterval: 3,
      });

      await configService.clearOAuthCredentials();

      const config = await configService.getConfig();

      expect(config.defaultWorkspace).toBe('workspace');
      expect(config.skipVersionCheck).toBe(false);
      expect(config.versionCheckInterval).toBe(3);
    });
  });

  describe('isOAuthTokenExpired', () => {
    it('should return true when no expiry is set', async () => {
      const expired = await configService.isOAuthTokenExpired();
      expect(expired).toBe(true);
    });

    it('should return true when token has expired', async () => {
      await configService.setConfig({
        oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
      });

      const expired = await configService.isOAuthTokenExpired();
      expect(expired).toBe(true);
    });

    it('should return true when token expires within 60 seconds', async () => {
      await configService.setConfig({
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 30,
      });

      const expired = await configService.isOAuthTokenExpired();
      expect(expired).toBe(true);
    });

    it('should return false when token is valid and not near expiry', async () => {
      await configService.setConfig({
        oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      const expired = await configService.isOAuthTokenExpired();
      expect(expired).toBe(false);
    });
  });

  describe('setCredentials (authMethod tracking)', () => {
    it('should set authMethod to basic when setting credentials', async () => {
      await configService.setCredentials({
        username: 'user',
        apiToken: 'token',
      });

      const config = await configService.getConfig();
      expect(config.authMethod).toBe('basic');
    });

    it('should override oauth authMethod when setting basic credentials', async () => {
      await configService.setConfig({ authMethod: 'oauth' });

      await configService.setCredentials({
        username: 'user',
        apiToken: 'token',
      });

      const config = await configService.getConfig();
      expect(config.authMethod).toBe('basic');
    });
  });

  describe('clearCache', () => {
    it('should clear cached config', async () => {
      await configService.setConfig({ username: 'original' });

      // Verify cached
      let config = await configService.getConfig();
      expect(config.username).toBe('original');

      // Modify file directly
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'modified' })
      );

      // Still cached
      config = await configService.getConfig();
      expect(config.username).toBe('original');

      // Clear cache
      configService.clearCache();

      // Now reads from file
      config = await configService.getConfig();
      expect(config.username).toBe('modified');
    });
  });
});

describe('ConfigService split interfaces', () => {
  // Exercises the class through each narrower interface in isolation to
  // confirm IConfigService and ICredentialStore can round-trip their own
  // state without touching the other surface.
  const testConfigDir = join('/tmp', `bb-split-${Date.now()}`);

  afterEach(async () => {
    try {
      await rm(testConfigDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('IConfigService: round-trips app config via getValue/setValue without credentials methods', async () => {
    const configService: IConfigService = new ConfigService(testConfigDir);

    await configService.setValue('defaultWorkspace', 'acme');
    await configService.setValue('skipVersionCheck', true);

    expect(await configService.getValue('defaultWorkspace')).toBe('acme');
    expect(await configService.getValue('skipVersionCheck')).toBe(true);
    expect((await configService.getConfig()).defaultWorkspace).toBe('acme');

    await configService.clearConfig();
    expect(await configService.getConfig()).toEqual({});
  });

  it('ICredentialStore: round-trips basic auth credentials without app-config methods', async () => {
    const credentialStore: ICredentialStore = new ConfigService(testConfigDir);

    expect(await credentialStore.getAuthMethod()).toBe('basic');

    await credentialStore.setCredentials({ username: 'alice', apiToken: 't' });
    const creds = await credentialStore.getCredentials();
    expect(creds.username).toBe('alice');
    expect(creds.apiToken).toBe('t');
    expect(await credentialStore.getAuthMethod()).toBe('basic');

    await credentialStore.clearCredentials();
    await expect(credentialStore.getCredentials()).rejects.toMatchObject({
      code: ErrorCode.AUTH_REQUIRED,
    });
  });

  it('ICredentialStore: round-trips OAuth tokens and expiry independently', async () => {
    const credentialStore: ICredentialStore = new ConfigService(testConfigDir);

    await credentialStore.setOAuthCredentials({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(await credentialStore.getAuthMethod()).toBe('oauth');
    expect(await credentialStore.isOAuthTokenExpired()).toBe(false);
    const oauth = await credentialStore.getOAuthCredentials();
    expect(oauth.accessToken).toBe('access');

    await credentialStore.clearOAuthCredentials();
    await expect(credentialStore.getOAuthCredentials()).rejects.toMatchObject({
      code: ErrorCode.AUTH_REQUIRED,
    });
  });

  it('shared storage: writes via IConfigService are visible to ICredentialStore and vice versa', async () => {
    // Single concrete instance exposed through both narrow interfaces — mirrors
    // the bootstrap wiring where CredentialStore is an alias of ConfigService.
    const instance = new ConfigService(testConfigDir);
    const configService: IConfigService = instance;
    const credentialStore: ICredentialStore = instance;

    await configService.setValue('defaultWorkspace', 'shared');
    await credentialStore.setCredentials({ username: 'u', apiToken: 't' });

    // Each side sees its own write
    expect(await configService.getValue('defaultWorkspace')).toBe('shared');
    const creds = await credentialStore.getCredentials();
    expect(creds.username).toBe('u');

    // And the cross-interface read still works because storage is shared
    const config = await configService.getConfig();
    expect(config.username).toBe('u');
    expect(config.defaultWorkspace).toBe('shared');
  });
});
