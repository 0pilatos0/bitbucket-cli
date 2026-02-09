/**
 * ConfigService tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ConfigService } from '../../src/services/config.service.js';
import { ErrorCode } from '../../src/types/errors.js';
import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

describe('ConfigService', () => {
  const testConfigDir = join('/tmp', `bb-test-${Date.now()}`);
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
