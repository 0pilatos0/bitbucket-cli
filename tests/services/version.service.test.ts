/**
 * Tests for VersionService
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { VersionService } from '../../src/services/version.service.js';
import { createMockConfigService } from '../setup.js';
import type { BBConfig } from '../../src/types/config.js';

const originalFetch = globalThis.fetch;
const ALL_CI_ENV_VARS = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'BUILD_ID',
  'BUILD_NUMBER',
  'DRONE',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'CIRCLECI',
  'TRAVIS',
  'JENKINS_URL',
  'HUDSON_URL',
] as const;

function stubFetchWithLatest(latest: string): { callCount: () => number } {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ 'dist-tags': { latest } }),
    } as unknown as Response;
  }) as typeof fetch;
  return { callCount: () => calls };
}

function stubFetchWithStatus(status: number, statusText = 'Error'): void {
  globalThis.fetch = (async () => {
    return {
      ok: false,
      status,
      statusText,
      json: async () => ({}),
    } as unknown as Response;
  }) as typeof fetch;
}

function stubFetchToThrow(error: Error): void {
  globalThis.fetch = (async () => {
    throw error;
  }) as typeof fetch;
}

describe('VersionService', () => {
  let service: VersionService;
  let mockConfig: BBConfig;

  beforeEach(() => {
    mockConfig = {};
    service = new VersionService(createMockConfigService(mockConfig), '1.0.0');
    // Clear any CI env vars that might have leaked in
    for (const envVar of ALL_CI_ENV_VARS) {
      delete process.env[envVar];
    }
  });

  afterEach(() => {
    for (const envVar of ALL_CI_ENV_VARS) {
      delete process.env[envVar];
    }
    globalThis.fetch = originalFetch;
  });

  describe('checkForUpdate', () => {
    it('should return null when skipVersionCheck is true', async () => {
      mockConfig.skipVersionCheck = true;
      service = new VersionService(
        createMockConfigService(mockConfig),
        '1.0.0'
      );

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return null when legacy skipVersionCheck is string true', async () => {
      const legacyConfig = {
        skipVersionCheck: 'true',
      } as unknown as BBConfig;

      service = new VersionService(
        createMockConfigService(legacyConfig),
        '1.0.0'
      );

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return null in CI environment', async () => {
      process.env.CI = 'true';

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return null when check was performed recently', async () => {
      mockConfig.lastVersionCheck = new Date().toISOString();
      service = new VersionService(
        createMockConfigService(mockConfig),
        '1.0.0'
      );

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should respect custom versionCheckInterval', async () => {
      mockConfig.versionCheckInterval = 7; // 7 days
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3); // 3 days ago
      mockConfig.lastVersionCheck = oldDate.toISOString();
      service = new VersionService(
        createMockConfigService(mockConfig),
        '1.0.0'
      );

      const result = await service.checkForUpdate();

      // Should not check because 3 days < 7 days
      expect(result).toBeNull();
    });

    it('should respect legacy string versionCheckInterval', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3); // 3 days ago

      const legacyConfig = {
        versionCheckInterval: '7',
        lastVersionCheck: oldDate.toISOString(),
      } as unknown as BBConfig;

      service = new VersionService(
        createMockConfigService(legacyConfig),
        '1.0.0'
      );

      const result = await service.checkForUpdate();

      // Should not check because 3 days < 7 days
      expect(result).toBeNull();
    });
  });

  describe('getInstallCommand', () => {
    it('should return correct install command', () => {
      const command = service.getInstallCommand();

      expect(command).toBe('bun install -g @pilatos/bitbucket-cli');
    });
  });

  describe('CI environment detection', () => {
    for (const envVar of ALL_CI_ENV_VARS) {
      it(`should detect ${envVar} environment`, async () => {
        process.env[envVar] = 'true';

        const result = await service.checkForUpdate();

        expect(result).toBeNull();

        delete process.env[envVar];
      });
    }
  });

  describe('fetchLatestVersion (via checkForUpdate)', () => {
    it('should fetch from the @pilatos/bitbucket-cli npm registry endpoint', async () => {
      let capturedUrl = '';
      globalThis.fetch = (async (url: unknown) => {
        capturedUrl = String(url);
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ 'dist-tags': { latest: '1.0.0' } }),
        } as unknown as Response;
      }) as typeof fetch;

      await service.checkForUpdate();

      expect(capturedUrl).toBe(
        'https://registry.npmjs.org/@pilatos/bitbucket-cli'
      );
    });

    it('should send Accept: application/json', async () => {
      let capturedHeaders: HeadersInit | undefined;
      globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
        capturedHeaders = init?.headers;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ 'dist-tags': { latest: '1.0.0' } }),
        } as unknown as Response;
      }) as typeof fetch;

      await service.checkForUpdate();

      expect(capturedHeaders).toEqual({ Accept: 'application/json' });
    });

    it('should return null silently when registry returns 503', async () => {
      stubFetchWithStatus(503, 'Service Unavailable');

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return null silently when fetch throws', async () => {
      stubFetchToThrow(new Error('ENETUNREACH'));

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
    });

    it('should update lastVersionCheck on successful fetch', async () => {
      const configService = createMockConfigService({});
      service = new VersionService(configService, '1.0.0');
      stubFetchWithLatest('1.0.0');
      const before = Date.now();

      await service.checkForUpdate();

      const stored = await configService.getValue('lastVersionCheck');
      expect(stored).toBeDefined();
      const parsedMs = new Date(stored!).getTime();
      // Allow a small window for test execution time.
      expect(parsedMs).toBeGreaterThanOrEqual(before - 1000);
      expect(parsedMs).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('should not update lastVersionCheck when fetch fails', async () => {
      const configService = createMockConfigService({});
      service = new VersionService(configService, '1.0.0');
      stubFetchWithStatus(500);

      await service.checkForUpdate();

      expect(await configService.getValue('lastVersionCheck')).toBeUndefined();
    });

    it('should report no update when current version equals latest', async () => {
      stubFetchWithLatest('1.0.0');

      const result = await service.checkForUpdate();

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        updateAvailable: false,
      });
    });

    it('should report update when latest is newer than current', async () => {
      service = new VersionService(
        createMockConfigService(mockConfig),
        '1.0.0'
      );
      stubFetchWithLatest('1.0.1');

      const result = await service.checkForUpdate();

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.1',
        updateAvailable: true,
      });
    });
  });

  describe('semver comparison (isNewerVersion via checkForUpdate)', () => {
    async function compare(
      currentVersion: string,
      latestVersion: string
    ): Promise<boolean> {
      const config: BBConfig = {};
      const svc = new VersionService(
        createMockConfigService(config),
        currentVersion
      );
      stubFetchWithLatest(latestVersion);
      const result = await svc.checkForUpdate();
      if (!result) {
        throw new Error(
          `Expected a version comparison result for ${currentVersion} vs ${latestVersion}`
        );
      }
      return result.updateAvailable;
    }

    it.each([
      // [current, latest, expectedUpdateAvailable, description]
      ['1.0.0', '2.0.0', true, 'major bump'],
      ['1.0.0', '1.1.0', true, 'minor bump'],
      ['1.0.0', '1.0.1', true, 'patch bump'],
      ['1.2.9', '1.2.10', true, 'multi-digit patch bump (lexical trap)'],
      ['1.9.9', '2.0.0', true, 'major rollover'],
      ['1.0.0', '1.0.0', false, 'equal versions'],
      ['2.0.0', '1.9.9', false, 'older major'],
      ['1.1.0', '1.0.9', false, 'older minor'],
      ['1.0.1', '1.0.0', false, 'older patch'],
      ['1.0.10', '1.0.9', false, 'multi-digit reverse'],
    ])(
      'compares %s → %s as updateAvailable=%s (%s)',
      async (current, latest, expected) => {
        expect(await compare(current as string, latest as string)).toBe(
          expected as boolean
        );
      }
    );

    it('treats a v-prefixed latest version the same as unprefixed', async () => {
      expect(await compare('1.0.0', 'v1.0.1')).toBe(true);
      expect(await compare('1.0.0', 'v1.0.0')).toBe(false);
      expect(await compare('v1.0.0', '1.0.1')).toBe(true);
    });

    it('pads missing parts with zeros', async () => {
      expect(await compare('1.0', '1.0.0')).toBe(false);
      expect(await compare('1.0.0', '1.0')).toBe(false);
      expect(await compare('1.0', '1.0.1')).toBe(true);
      expect(await compare('2', '1.9.9')).toBe(false);
    });

    it('treats stable as newer than pre-release with the same numeric parts', async () => {
      // Pre-release tags without trailing numeric components (e.g. "1.0.0-rc")
      // parse to the same numeric parts as the stable version, so the
      // has-pre-release tiebreaker runs. With `1.0.0-rc.1`, the trailing `.1`
      // bumps the numeric parts to [1,0,0,1] — a known quirk documented below.
      expect(await compare('1.0.0-beta', '1.0.0')).toBe(true);
      expect(await compare('1.0.0-rc', '1.0.0')).toBe(true);
    });

    it('does not treat pre-release as newer than matching stable', async () => {
      expect(await compare('1.0.0', '1.0.0-beta')).toBe(false);
    });

    it('does not rank pre-release tags against each other', async () => {
      // The comparator only distinguishes stable vs pre-release; it does not
      // attempt to rank pre-release tags themselves. Pin that behavior so a
      // future "smarter" implementation has to update this test deliberately.
      expect(await compare('1.0.0-alpha', '1.0.0-beta')).toBe(false);
      expect(await compare('1.0.0-beta', '1.0.0-alpha')).toBe(false);
    });

    it('treats trailing dotted pre-release segments as additional numeric parts (quirk)', async () => {
      // "1.0.0-rc.1" splits on '.' into ['1','0','0-rc','1'] and parses as
      // [1,0,0,1]. This makes a pre-release appear numerically higher than
      // its parent stable version — a known quirk of the current comparator.
      // Pin it so a future rewrite is intentional.
      expect(await compare('1.0.0', '1.0.0-rc.1')).toBe(true);
      expect(await compare('1.0.0-rc.1', '1.0.0')).toBe(false);
    });

    it('compares numeric parts of pre-release versions by their leading digits', async () => {
      // "1.0.1-beta" parses major/minor/patch = [1,0,1], newer than [1,0,0].
      expect(await compare('1.0.0', '1.0.1-beta')).toBe(true);
    });

    it('falls back to 0 for non-numeric parts', async () => {
      // "1.x.0" parseInt('x') → NaN → 0, so this becomes [1,0,0].
      expect(await compare('1.x.0', '1.0.1')).toBe(true);
      expect(await compare('1.x.0', '1.0.0')).toBe(false);
    });
  });

  describe('skip logic interactions', () => {
    it('should NOT fetch when skipVersionCheck is true', async () => {
      service = new VersionService(
        createMockConfigService({ skipVersionCheck: true }),
        '1.0.0'
      );
      const fetchStub = stubFetchWithLatest('99.99.99');

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
      expect(fetchStub.callCount()).toBe(0);
    });

    it('should NOT fetch when running in CI', async () => {
      process.env.CI = '1';
      const fetchStub = stubFetchWithLatest('99.99.99');

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
      expect(fetchStub.callCount()).toBe(0);
    });

    it('should NOT fetch when a recent check exists', async () => {
      service = new VersionService(
        createMockConfigService({
          lastVersionCheck: new Date().toISOString(),
        }),
        '1.0.0'
      );
      const fetchStub = stubFetchWithLatest('99.99.99');

      const result = await service.checkForUpdate();

      expect(result).toBeNull();
      expect(fetchStub.callCount()).toBe(0);
    });

    it('should fetch when the last check is older than the interval', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 10);
      service = new VersionService(
        createMockConfigService({
          lastVersionCheck: old.toISOString(),
          versionCheckInterval: 1,
        }),
        '1.0.0'
      );
      const fetchStub = stubFetchWithLatest('1.0.1');

      const result = await service.checkForUpdate();

      expect(result).not.toBeNull();
      expect(fetchStub.callCount()).toBe(1);
    });
  });
});
