/**
 * Named-account credential store backed by the config file, with secrets
 * optionally kept in the OS keychain.
 */

import type {
  AccountSummary,
  IConfigService,
  ICredentialStore,
  ISecretStorage,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import type {
  AccountConfig,
  AuthCredentials,
  AuthMethod,
  BBConfig,
  CredentialStorage,
  OAuthClient,
  OAuthCredentials,
} from '../types/config.js';

export const DEFAULT_ACCOUNT = 'default';

// Names double as JSON keys and keychain entry names. Requiring a leading
// letter or digit also rules out `__proto__` and friends.
const ACCOUNT_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._@+-]*$/;

const SECRET_FIELDS = [
  'apiToken',
  'oauthAccessToken',
  'oauthRefreshToken',
  'oauthClientSecret',
] as const;

const CREDENTIAL_FIELDS = [
  'username',
  'apiToken',
  'oauthAccessToken',
  'oauthRefreshToken',
  'oauthExpiresAt',
  'oauthClientId',
  'oauthClientSecret',
] as const;

const ACCOUNT_FIELDS = ['authMethod', ...CREDENTIAL_FIELDS] as const;

type AccountSecrets = Pick<AccountConfig, (typeof SECRET_FIELDS)[number]>;

interface AccountsState {
  accounts: Record<string, AccountConfig>;
  activeAccount?: string;
}

function pick<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

function omit<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[]
): Omit<T, K> {
  const result = { ...source };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

function hasCredentialFields(account: AccountConfig): boolean {
  return CREDENTIAL_FIELDS.some((key) => account[key] !== undefined);
}

/**
 * Read the accounts out of a config. A config written before named accounts
 * keeps its credentials at the top level; those become the `default` account.
 * Only an older bb writes them, so they win over a stored `default`.
 */
function toAccountsState(config: BBConfig): AccountsState {
  const accounts = { ...config.accounts };
  let { activeAccount } = config;

  const legacy = pick(config, ACCOUNT_FIELDS);
  if (hasCredentialFields(legacy)) {
    accounts[DEFAULT_ACCOUNT] = legacy;
    activeAccount ??= DEFAULT_ACCOUNT;
  }

  return { accounts, activeAccount };
}

function findAccount(
  accounts: Record<string, AccountConfig>,
  name: string
): AccountConfig | undefined {
  return Object.hasOwn(accounts, name) ? accounts[name] : undefined;
}

function parseSecrets(raw: string): AccountSecrets {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const secrets: AccountSecrets = {};
    for (const key of SECRET_FIELDS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string') {
        secrets[key] = value;
      }
    }
    return secrets;
  } catch {
    return {};
  }
}

export function validateAccountName(name: string): string {
  if (!ACCOUNT_NAME_PATTERN.test(name)) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: `Invalid account name '${name}'. Use letters, digits, '.', '_', '-', '@' or '+', starting with a letter or digit.`,
      context: { account: name },
    });
  }
  return name;
}

export class CredentialStore implements ICredentialStore {
  private selectedAccount: string | undefined;
  private readonly secretCache = new Map<string, AccountSecrets>();

  constructor(
    private readonly configService: IConfigService,
    private readonly keychain: ISecretStorage,
    private readonly env: NodeJS.ProcessEnv = process.env
  ) {}

  public useAccount(name: string): void {
    this.selectedAccount = name;
  }

  public async getAccountName(): Promise<string> {
    const name =
      this.selectedAccount ??
      (this.env.BB_ACCOUNT || undefined) ??
      (await this.readState()).activeAccount ??
      DEFAULT_ACCOUNT;
    return validateAccountName(name);
  }

  public async listAccounts(): Promise<AccountSummary[]> {
    const { accounts, activeAccount = DEFAULT_ACCOUNT } =
      await this.readState();
    return Object.entries(accounts).map(([name, account]) => ({
      name,
      active: name === activeAccount,
      authMethod: account.authMethod,
      username: account.username,
      storage: account.storage ?? 'file',
    }));
  }

  public async switchAccount(name: string): Promise<void> {
    validateAccountName(name);
    const config = await this.configService.getConfig();
    const state = toAccountsState(config);
    if (!findAccount(state.accounts, name)) {
      const known = Object.keys(state.accounts);
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message:
          `No account named '${name}'. ` +
          (known.length > 0
            ? `Known accounts: ${known.join(', ')}.`
            : `Run 'bb auth login --account ${name}' to add it.`),
        context: { account: name },
      });
    }
    await this.writeState(config, { ...state, activeAccount: name });
  }

  public async setStorage(storage: CredentialStorage): Promise<number> {
    const { accounts } = await this.readState();
    let moved = 0;
    for (const [name, account] of Object.entries(accounts)) {
      if ((account.storage ?? 'file') === storage) {
        continue;
      }
      await this.saveAccount(
        name,
        await this.withSecrets(name, account),
        storage
      );
      moved++;
    }
    await this.configService.setValue('credentialStorage', storage);
    return moved;
  }

  public async getAuthMethod(): Promise<AuthMethod> {
    return (await this.currentRecord())?.authMethod ?? 'basic';
  }

  public async hasCredentials(): Promise<boolean> {
    const account = await this.currentAccount();
    return Boolean(
      (account?.username && account.apiToken) ||
      (account?.oauthAccessToken && account.oauthRefreshToken)
    );
  }

  public async getCredentials(): Promise<AuthCredentials> {
    const account = await this.currentAccount();
    if (!account?.username || !account.apiToken) {
      throw await this.authRequired('Authentication required.');
    }
    return { username: account.username, apiToken: account.apiToken };
  }

  public async setCredentials(credentials: AuthCredentials): Promise<void> {
    await this.updateAccount((account) => ({
      ...account,
      authMethod: 'basic',
      username: credentials.username,
      apiToken: credentials.apiToken,
    }));
  }

  public async clearCredentials(): Promise<void> {
    await this.updateAccount((account) =>
      omit(account, ['username', 'apiToken'])
    );
  }

  public async getOAuthCredentials(): Promise<OAuthCredentials> {
    const account = await this.currentAccount();
    if (
      !account?.oauthAccessToken ||
      !account.oauthRefreshToken ||
      !account.oauthExpiresAt
    ) {
      throw await this.authRequired('OAuth authentication required.');
    }
    return {
      accessToken: account.oauthAccessToken,
      refreshToken: account.oauthRefreshToken,
      expiresAt: account.oauthExpiresAt,
    };
  }

  public async setOAuthCredentials(
    credentials: OAuthCredentials,
    client: OAuthClient = {}
  ): Promise<void> {
    await this.updateAccount((account) => ({
      ...omit(account, ['username', 'apiToken']),
      authMethod: 'oauth',
      oauthAccessToken: credentials.accessToken,
      oauthRefreshToken: credentials.refreshToken,
      oauthExpiresAt: credentials.expiresAt,
      oauthClientId: client.clientId ?? account.oauthClientId,
      oauthClientSecret: client.clientSecret ?? account.oauthClientSecret,
    }));
  }

  public async getOAuthClient(): Promise<OAuthClient> {
    const account = await this.currentAccount();
    return {
      clientId: account?.oauthClientId,
      clientSecret: account?.oauthClientSecret,
    };
  }

  public async clearOAuthCredentials(): Promise<void> {
    await this.updateAccount((account) =>
      omit(account, [
        'authMethod',
        'oauthAccessToken',
        'oauthRefreshToken',
        'oauthExpiresAt',
        'oauthClientId',
        'oauthClientSecret',
      ])
    );
  }

  public async isOAuthTokenExpired(): Promise<boolean> {
    const expiresAt = (await this.currentRecord())?.oauthExpiresAt;
    if (!expiresAt) {
      return true;
    }
    // Consider expired if within 60 seconds of expiry
    return Date.now() >= (expiresAt - 60) * 1000;
  }

  private async readState(): Promise<AccountsState> {
    return toAccountsState(await this.configService.getConfig());
  }

  /** The current account as stored in the config file, without secrets. */
  private async currentRecord(): Promise<AccountConfig | undefined> {
    const name = await this.getAccountName();
    return findAccount((await this.readState()).accounts, name);
  }

  private async currentAccount(): Promise<AccountConfig | undefined> {
    const name = await this.getAccountName();
    const account = findAccount((await this.readState()).accounts, name);
    return account && this.withSecrets(name, account);
  }

  private async withSecrets(
    name: string,
    account: AccountConfig
  ): Promise<AccountConfig> {
    if (account.storage !== 'keychain') {
      return account;
    }
    let secrets = this.secretCache.get(name);
    if (!secrets) {
      const raw = await this.keychain.get(name);
      secrets = raw ? parseSecrets(raw) : {};
      this.secretCache.set(name, secrets);
    }
    return { ...account, ...secrets };
  }

  private async updateAccount(
    update: (account: AccountConfig) => AccountConfig
  ): Promise<void> {
    const name = await this.getAccountName();
    await this.saveAccount(name, update((await this.currentAccount()) ?? {}));
  }

  /**
   * Write one account in `storage` (default: the `credentialStorage`
   * setting). An account left without credentials is removed. Secrets are
   * written to their new home before the old copy goes, so a failure midway
   * never loses them.
   */
  private async saveAccount(
    name: string,
    account: AccountConfig,
    storage?: CredentialStorage
  ): Promise<void> {
    const config = await this.configService.getConfig();
    const state = toAccountsState(config);
    const previous = findAccount(state.accounts, name);
    const fields = omit(account, ['storage']);
    const accounts = { ...state.accounts };

    if (!hasCredentialFields(fields)) {
      delete accounts[name];
    } else if ((storage ?? config.credentialStorage) === 'keychain') {
      const secrets = pick(fields, SECRET_FIELDS);
      await this.keychain.set(name, JSON.stringify(secrets));
      this.secretCache.set(name, secrets);
      accounts[name] = { ...omit(fields, SECRET_FIELDS), storage: 'keychain' };
    } else {
      accounts[name] = fields;
    }

    await this.writeState(config, { ...state, accounts });

    if (
      previous?.storage === 'keychain' &&
      accounts[name]?.storage !== 'keychain'
    ) {
      await this.keychain.delete(name);
      this.secretCache.delete(name);
    }
  }

  /** Persist accounts, dropping any pre-account top-level credentials. */
  private async writeState(
    config: BBConfig,
    state: AccountsState
  ): Promise<void> {
    await this.configService.setConfig({
      ...omit(config, ACCOUNT_FIELDS),
      accounts: state.accounts,
      activeAccount: state.activeAccount,
    });
  }

  private async authRequired(reason: string): Promise<BBError> {
    const name = await this.getAccountName();
    const login =
      name === DEFAULT_ACCOUNT
        ? 'bb auth login'
        : `bb auth login --account ${name}`;
    return new BBError({
      code: ErrorCode.AUTH_REQUIRED,
      message:
        name === DEFAULT_ACCOUNT
          ? `${reason} Run '${login}'.`
          : `${reason} No credentials for account '${name}'. Run '${login}'.`,
    });
  }
}
