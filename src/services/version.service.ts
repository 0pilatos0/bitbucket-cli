/**
 * Version service for checking npm registry for updates
 */

import type { IConfigService } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import {
  coerceSkipVersionCheckValue,
  coerceVersionCheckIntervalValue,
} from '../types/config.js';
import type { VersionCheckResult } from '../types/version.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@pilatos/bitbucket-cli';
const PACKAGE_NAME = '@pilatos/bitbucket-cli';

interface NpmRegistryResponse {
  'dist-tags': {
    latest: string;
  };
}

export class VersionService {
  private readonly configService: IConfigService;
  private readonly currentVersion: string;

  constructor(configService: IConfigService, currentVersion: string) {
    this.configService = configService;
    this.currentVersion = currentVersion;
  }

  /**
   * Check if an update is available, respecting user preferences and caching
   */
  public async checkForUpdate(): Promise<VersionCheckResult | null> {
    // Check if user has disabled version checks
    const skipCheckRaw = await this.configService.getValue('skipVersionCheck');
    const skipCheck = coerceSkipVersionCheckValue(skipCheckRaw as unknown);
    if (skipCheck === true) {
      return null;
    }

    // Check if we're in a CI environment
    if (this.isCIEnvironment()) {
      return null;
    }

    // Check if enough time has passed since last check
    const shouldCheck = await this.shouldCheckVersion();
    if (!shouldCheck) {
      return null;
    }

    try {
      // Fetch latest version from npm
      const latestVersion = await this.fetchLatestVersion();

      // Update last check timestamp
      await this.updateLastCheckTimestamp();

      // Compare versions
      const updateAvailable = this.isNewerVersion(
        latestVersion,
        this.currentVersion
      );

      return {
        currentVersion: this.currentVersion,
        latestVersion,
        updateAvailable,
      };
    } catch {
      // Silently fail - don't bother user with network errors
      return null;
    }
  }

  /**
   * Check if we should check for updates based on last check time
   */
  private async shouldCheckVersion(): Promise<boolean> {
    const lastCheck = await this.configService.getValue('lastVersionCheck');

    if (!lastCheck) {
      return true;
    }

    const lastCheckDate = new Date(lastCheck);
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastCheckDate.getTime();

    // Get custom interval or use default
    const intervalDays = await this.configService.getValue(
      'versionCheckInterval'
    );
    const days = coerceVersionCheckIntervalValue(intervalDays) ?? 1;

    const intervalMs = days * 24 * 60 * 60 * 1000;

    return timeSinceLastCheck >= intervalMs;
  }

  /**
   * Update the last version check timestamp
   */
  private async updateLastCheckTimestamp(): Promise<void> {
    await this.configService.setValue(
      'lastVersionCheck',
      new Date().toISOString()
    );
  }

  /**
   * Fetch the latest version from npm registry
   */
  private async fetchLatestVersion(): Promise<string> {
    const response = await fetch(NPM_REGISTRY_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new BBError({
        code: ErrorCode.NETWORK_ERROR,
        message: `Failed to fetch version info: ${response.statusText}`,
      });
    }

    const data = (await response.json()) as NpmRegistryResponse;
    return data['dist-tags'].latest;
  }

  /**
   * Check if we're running in a CI environment
   */
  private isCIEnvironment(): boolean {
    const ciEnvVars = [
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
    ];

    return ciEnvVars.some((varName) => process.env[varName] !== undefined);
  }

  /**
   * Compare two semver versions
   * Returns true if newVersion is newer than currentVersion
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string): number[] => {
      // Remove 'v' prefix if present
      const cleanVersion = version.replace(/^v/, '');
      return cleanVersion.split('.').map((part) => {
        // Handle pre-release versions like "1.0.0-beta.1"
        const numPart = part.split('-')[0]!;
        return Number.parseInt(numPart, 10) || 0;
      });
    };

    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (newPart > currentPart) {
        return true;
      }
      if (newPart < currentPart) {
        return false;
      }
    }

    // Versions are equal, check for pre-release
    const newHasPreRelease = newVersion.includes('-');
    const currentHasPreRelease = currentVersion.includes('-');

    // Stable release is newer than pre-release with same version numbers
    if (!newHasPreRelease && currentHasPreRelease) {
      return true;
    }

    return false;
  }

  /**
   * Get the install command for the package
   */
  public getInstallCommand(): string {
    return `bun install -g ${PACKAGE_NAME}`;
  }
}
