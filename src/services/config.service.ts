/**
 * Configuration service implementation
 */

import { join } from 'node:path';
import { homedir } from 'node:os';
import type { IConfigService } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type { BBConfig, AuthCredentials } from '../types/config.js';

export class ConfigService implements IConfigService {
  private readonly configDir: string;
  private readonly configFile: string;
  private configCache: BBConfig | null = null;

  constructor(configDir?: string) {
    this.configDir = configDir ?? join(homedir(), '.config', 'bb');
    this.configFile = join(this.configDir, 'config.json');
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

  /**
   * Clear the config cache (useful for testing)
   */
  public clearCache(): void {
    this.configCache = null;
  }
}
