/**
 * Configuration service implementation
 */

import { join, win32 } from 'node:path';
import { homedir } from 'node:os';
import type { IConfigService } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type {
  BBConfig,
  AuthCredentials,
  OAuthCredentials,
  AuthMethod,
} from '../types/config.js';

interface ConfigServicePathOptions {
  platform?: NodeJS.Platform;
  appData?: string;
  homeDir?: string;
}

export class ConfigService implements IConfigService {
  private readonly configDir: string;
  private readonly configFile: string;
  private configCache: BBConfig | null = null;

  constructor(configDir?: string, options: ConfigServicePathOptions = {}) {
    const platform = options.platform ?? process.platform;
    const joinPath = platform === 'win32' ? win32.join : join;

    this.configDir =
      configDir ?? this.resolveDefaultConfigDir({ ...options, platform });
    this.configFile = joinPath(this.configDir, 'config.json');
  }

  private resolveDefaultConfigDir(options: ConfigServicePathOptions): string {
    const platform = options.platform ?? process.platform;

    if (platform === 'win32') {
      const appDataDir = options.appData ?? process.env.APPDATA;
      if (appDataDir) {
        return win32.join(appDataDir, 'bb');
      }

      const homeDir = options.homeDir ?? homedir();
      return win32.join(homeDir, 'AppData', 'Roaming', 'bb');
    }

    const homeDir = options.homeDir ?? homedir();
    return join(homeDir, '.config', 'bb');
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      throw new BBError({
        code: ErrorCode.CONFIG_WRITE_FAILED,
        message: `Failed to create config directory: ${this.configDir}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  public async getConfig(): Promise<BBConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const fs = await import('node:fs/promises');
      const data = await fs.readFile(this.configFile, 'utf-8');
      this.configCache = JSON.parse(data) as BBConfig;
      return this.configCache;
    } catch (error) {
      // File doesn't exist - return empty config
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.configCache = {};
        return this.configCache;
      }

      throw new BBError({
        code: ErrorCode.CONFIG_READ_FAILED,
        message: `Failed to read config file: ${this.configFile}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  public async setConfig(config: BBConfig): Promise<void> {
    await this.ensureConfigDir();

    try {
      const fs = await import('node:fs/promises');
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), {
        mode: 0o600, // Secure permissions
      });
      this.configCache = config;
    } catch (error) {
      throw new BBError({
        code: ErrorCode.CONFIG_WRITE_FAILED,
        message: `Failed to write config file: ${this.configFile}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  public async getCredentials(): Promise<AuthCredentials> {
    const config = await this.getConfig();
    const { username, apiToken } = config;

    if (!username || !apiToken) {
      throw new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message:
          "Authentication required. Run 'bb auth login' to authenticate.",
      });
    }

    return { username, apiToken };
  }

  public async setCredentials(credentials: AuthCredentials): Promise<void> {
    const config = await this.getConfig();
    await this.setConfig({
      ...config,
      authMethod: 'basic',
      username: credentials.username,
      apiToken: credentials.apiToken,
    });
  }

  public async clearCredentials(): Promise<void> {
    const config = await this.getConfig();
    const { username: _username, apiToken: _apiToken, ...rest } = config;
    await this.setConfig(rest);
  }

  public async clearConfig(): Promise<void> {
    this.configCache = null;
    await this.setConfig({});
  }

  public async getValue<K extends keyof BBConfig>(
    key: K
  ): Promise<BBConfig[K] | undefined> {
    const config = await this.getConfig();
    return config[key];
  }

  public async setValue<K extends keyof BBConfig>(
    key: K,
    value: BBConfig[K]
  ): Promise<void> {
    const config = await this.getConfig();
    await this.setConfig({
      ...config,
      [key]: value,
    });
  }

  public getConfigPath(): string {
    return this.configFile;
  }

  public async getAuthMethod(): Promise<AuthMethod> {
    const config = await this.getConfig();
    return config.authMethod ?? 'basic';
  }

  public async getOAuthCredentials(): Promise<OAuthCredentials> {
    const config = await this.getConfig();
    const { oauthAccessToken, oauthRefreshToken, oauthExpiresAt } = config;

    if (!oauthAccessToken || !oauthRefreshToken || !oauthExpiresAt) {
      throw new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message:
          "OAuth authentication required. Run 'bb auth login' to authenticate.",
      });
    }

    return {
      accessToken: oauthAccessToken,
      refreshToken: oauthRefreshToken,
      expiresAt: oauthExpiresAt,
    };
  }

  public async setOAuthCredentials(
    credentials: OAuthCredentials
  ): Promise<void> {
    const config = await this.getConfig();
    const { username: _u, apiToken: _t, ...rest } = config;
    await this.setConfig({
      ...rest,
      authMethod: 'oauth',
      oauthAccessToken: credentials.accessToken,
      oauthRefreshToken: credentials.refreshToken,
      oauthExpiresAt: credentials.expiresAt,
    });
  }

  public async clearOAuthCredentials(): Promise<void> {
    const config = await this.getConfig();
    const {
      authMethod: _am,
      oauthAccessToken: _at,
      oauthRefreshToken: _rt,
      oauthExpiresAt: _ea,
      oauthClientId: _ci,
      oauthClientSecret: _cs,
      ...rest
    } = config;
    await this.setConfig(rest);
  }

  public async isOAuthTokenExpired(): Promise<boolean> {
    const config = await this.getConfig();
    if (!config.oauthExpiresAt) {
      return true;
    }
    // Consider expired if within 60 seconds of expiry
    return Date.now() >= (config.oauthExpiresAt - 60) * 1000;
  }

  /**
   * Clear the config cache (useful for testing)
   */
  public clearCache(): void {
    this.configCache = null;
  }
}
