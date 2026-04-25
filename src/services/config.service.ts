/**
 * Configuration service implementation
 */

import { posix, win32 } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type {
  IConfigService,
  ICredentialStore,
} from '../core/interfaces/services.js';
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

const CONFIG_FILE_MODE = 0o600;
const CONFIG_DIR_MODE = 0o700;
// Bits that must NOT be set on the config file or directory; any group/other
// access is treated as a hostile pre-existing path on a shared host.
const INSECURE_MODE_MASK = 0o077;

export class ConfigService implements IConfigService, ICredentialStore {
  private readonly configDir: string;
  private readonly configFile: string;
  private readonly platform: NodeJS.Platform;
  private configCache: BBConfig | null = null;

  constructor(configDir?: string, options: ConfigServicePathOptions = {}) {
    const platform = options.platform ?? process.platform;
    const joinPath = platform === 'win32' ? win32.join : posix.join;

    this.platform = platform;
    this.configDir =
      configDir ?? this.resolveDefaultConfigDir({ ...options, platform });
    this.configFile = joinPath(this.configDir, 'config.json');
  }

  private resolveDefaultConfigDir(options: ConfigServicePathOptions): string {
    const platform = options.platform ?? process.platform;
    // When a caller simulates a platform (e.g. tests), don't leak the real
    // process env — they must supply any env-derived paths explicitly.
    const isSimulatedPlatform = options.platform !== undefined;

    if (platform === 'win32') {
      const appDataDir =
        options.appData ??
        (isSimulatedPlatform ? undefined : process.env.APPDATA);
      if (appDataDir) {
        return win32.join(appDataDir, 'bb');
      }

      const homeDir = options.homeDir ?? homedir();
      return win32.join(homeDir, 'AppData', 'Roaming', 'bb');
    }

    const homeDir = options.homeDir ?? homedir();
    return posix.join(homeDir, '.config', 'bb');
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      await fs.mkdir(this.configDir, {
        recursive: true,
        mode: CONFIG_DIR_MODE,
      });
    } catch (error) {
      throw new BBError({
        code: ErrorCode.CONFIG_WRITE_FAILED,
        message: `Failed to create config directory: ${this.configDir}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  // POSIX permission bits are meaningless on Windows; skip the check there to
  // avoid spurious failures while still hardening the Linux/macOS hosts the
  // co-tenant scenario actually targets.
  private async verifyPermissions(
    path: string,
    expectedMode: number,
    kind: 'file' | 'directory'
  ): Promise<void> {
    if (this.platform === 'win32') return;

    const fs = await import('node:fs/promises');
    let stats;
    try {
      stats = await fs.stat(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }

    const mode = stats.mode & 0o777;
    if (mode & INSECURE_MODE_MASK) {
      const actual = mode.toString(8).padStart(3, '0');
      const expected = expectedMode.toString(8).padStart(3, '0');
      throw new BBError({
        code: ErrorCode.CONFIG_READ_FAILED,
        message:
          `Config ${kind} has insecure permissions (${actual}); ` +
          `expected ${expected}. Run: chmod ${expected} ${path}`,
      });
    }
  }

  public async getConfig(): Promise<BBConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const fs = await import('node:fs/promises');
      await this.verifyPermissions(
        this.configDir,
        CONFIG_DIR_MODE,
        'directory'
      );
      await this.verifyPermissions(this.configFile, CONFIG_FILE_MODE, 'file');

      const data = await fs.readFile(this.configFile, 'utf-8');
      this.configCache = JSON.parse(data) as BBConfig;
      return this.configCache;
    } catch (error) {
      // File doesn't exist - return empty config
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.configCache = {};
        return this.configCache;
      }

      // Permission errors already carry a precise message; don't wrap them.
      if (error instanceof BBError) {
        throw error;
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

    const fs = await import('node:fs/promises');
    const body = JSON.stringify(config, null, 2);
    // Unique suffix avoids EEXIST against a stale tmp from a prior crash while
    // still letting `flag: 'wx'` (O_EXCL) refuse to follow a hostile symlink
    // an attacker may have planted at this exact path.
    const tmpFile = `${this.configFile}.${randomUUID()}.tmp`;

    try {
      await fs.writeFile(tmpFile, body, {
        mode: CONFIG_FILE_MODE,
        flag: 'wx',
      });
      // rename() is atomic on the same filesystem, so a crash mid-write cannot
      // leave a partially-written config behind. It also replaces a symlink
      // sitting at configFile with the real file, rather than following it.
      await fs.rename(tmpFile, this.configFile);
      this.configCache = config;
    } catch (error) {
      try {
        await fs.unlink(tmpFile);
      } catch {
        // Best-effort cleanup; surface the original write error below.
      }

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
          "Authentication required. Run 'bb auth login' or set BB_USERNAME and BB_API_TOKEN.",
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
          "OAuth authentication required. Run 'bb auth login' or set BB_USERNAME and BB_API_TOKEN.",
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
