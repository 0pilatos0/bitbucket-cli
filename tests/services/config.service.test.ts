/**
 * ConfigService tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ConfigService } from '../../src/services/config.service.js';
import type { IConfigService } from '../../src/core/interfaces/services.js';
import { ErrorCode } from '../../src/types/errors.js';
import {
  mkdir,
  rm,
  readFile,
  writeFile,
  stat,
  symlink,
  chmod,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'testuser', defaultWorkspace: 'workspace' }),
        { mode: 0o600 }
      );

      configService.clearCache();
      const config = await configService.getConfig();

      expect(config.username).toBe('testuser');
      expect(config.defaultWorkspace).toBe('workspace');
    });

    it('should cache config after first read', async () => {
      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'original' }),
        { mode: 0o600 }
      );

      // First read
      await configService.getConfig();

      // Modify file directly
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'modified' }),
        { mode: 0o600 }
      );

      // Second read should return cached value
      const config = await configService.getConfig();

      expect(config.username).toBe('original');
    });

    it('should throw error for invalid JSON', async () => {
      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      await writeFile(join(testConfigDir, 'config.json'), 'invalid json {', {
        mode: 0o600,
      });

      configService.clearCache();

      await expect(configService.getConfig()).rejects.toMatchObject({
        code: ErrorCode.CONFIG_READ_FAILED,
      });
    });

    it('should refuse to read a config file with world/group-readable permissions', async () => {
      if (process.platform === 'win32') return;

      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      const file = join(testConfigDir, 'config.json');
      await writeFile(file, JSON.stringify({ username: 'u' }), { mode: 0o600 });
      await chmod(file, 0o644);

      configService.clearCache();

      await expect(configService.getConfig()).rejects.toMatchObject({
        code: ErrorCode.CONFIG_READ_FAILED,
        message: expect.stringContaining('insecure permissions'),
      });
    });

    it('should refuse to read when the config directory is world-traversable', async () => {
      if (process.platform === 'win32') return;

      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      const file = join(testConfigDir, 'config.json');
      await writeFile(file, JSON.stringify({ username: 'u' }), { mode: 0o600 });
      await chmod(testConfigDir, 0o755);

      configService.clearCache();

      await expect(configService.getConfig()).rejects.toMatchObject({
        code: ErrorCode.CONFIG_READ_FAILED,
        message: expect.stringContaining('insecure permissions'),
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

  describe('clearCache', () => {
    it('should clear cached config', async () => {
      await configService.setConfig({ username: 'original' });

      // Verify cached
      let config = await configService.getConfig();
      expect(config.username).toBe('original');

      // Modify file directly
      await writeFile(
        join(testConfigDir, 'config.json'),
        JSON.stringify({ username: 'modified' }),
        { mode: 0o600 }
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

  describe('setConfig (security hardening)', () => {
    it('should write the config file with mode 0600', async () => {
      if (process.platform === 'win32') return;

      await configService.setConfig({ username: 'u', apiToken: 't' });

      const stats = await stat(join(testConfigDir, 'config.json'));
      expect(stats.mode & 0o777).toBe(0o600);
    });

    it('should create the config directory with mode 0700', async () => {
      if (process.platform === 'win32') return;

      await configService.setConfig({ username: 'u' });

      const stats = await stat(testConfigDir);
      expect(stats.mode & 0o777).toBe(0o700);
    });

    it('should not follow a hostile symlink planted at config.json', async () => {
      if (process.platform === 'win32') return;

      await mkdir(testConfigDir, { recursive: true, mode: 0o700 });
      const decoyDir = join(tmpdir(), `bb-test-decoy-${Date.now()}`);
      await mkdir(decoyDir, { recursive: true, mode: 0o700 });
      const decoyTarget = join(decoyDir, 'attacker-target');
      await writeFile(decoyTarget, 'untouched', { mode: 0o600 });

      try {
        await symlink(decoyTarget, join(testConfigDir, 'config.json'));

        // setConfig writes to a tmp file under configDir and renames it over
        // the symlink. The rename replaces the link itself, so the attacker's
        // target file must remain untouched.
        await configService.setConfig({ username: 'u', apiToken: 't' });

        const decoyContent = await readFile(decoyTarget, 'utf-8');
        expect(decoyContent).toBe('untouched');

        const finalStat = await stat(join(testConfigDir, 'config.json'));
        expect(finalStat.isSymbolicLink()).toBe(false);
        expect(finalStat.mode & 0o777).toBe(0o600);
      } finally {
        await rm(decoyDir, { recursive: true, force: true });
      }
    });

    it('should not leave a tmp file behind on success', async () => {
      await configService.setConfig({ username: 'u' });

      const fs = await import('node:fs/promises');
      const entries = await fs.readdir(testConfigDir);
      const tmpFiles = entries.filter((name) => name.endsWith('.tmp'));
      expect(tmpFiles).toEqual([]);
    });
  });
});

describe('ConfigService split interfaces', () => {
  // Exercises the class through the narrower IConfigService interface.
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
});
