/**
 * Status command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  ICredentialStore,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { UsersApi } from '../../generated/api.js';
import { DEFAULT_ACCOUNT } from '../../services/credential-store.service.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface AuthStatus {
  authenticated: boolean;
  account?: string;
  accounts?: string[];
  method?: string;
  user?: {
    username: string;
    display_name: string;
    account_id: string;
  };
  defaultWorkspace?: string;
  tokenExpiresAt?: number;
}

export class StatusCommand extends BaseCommand<void, void> {
  public readonly name = 'status';
  public readonly description = 'Show authentication status';

  constructor(
    private readonly configService: IConfigService,
    private readonly credentialStore: ICredentialStore,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const config = await this.configService.getConfig();
    const authMethod = await this.credentialStore.getAuthMethod();
    const account = await this.credentialStore.getAccountName();
    const accounts = (await this.credentialStore.listAccounts()).map(
      (summary) => summary.name
    );
    const otherAccounts = accounts.filter((name) => name !== account);

    if (!(await this.credentialStore.hasCredentials())) {
      // Exit 1 like `gh auth status` so scripts can gate on it; the output
      // stays a status report rather than an error.
      process.exitCode = 1;
      if (context.globalOptions.json) {
        await this.output.json({ authenticated: false, account, accounts });
        return;
      }

      const login =
        account === DEFAULT_ACCOUNT
          ? 'bb auth login'
          : `bb auth login --account ${account}`;
      this.output.info(
        accounts.length > 0
          ? `Not logged in to account '${account}'`
          : 'Not logged in'
      );
      this.output.text(`Run ${this.output.highlight(login)} to authenticate.`);
      this.printOtherAccounts(otherAccounts);
      return;
    }

    const expiresAt =
      authMethod === 'oauth'
        ? (await this.credentialStore.getOAuthCredentials()).expiresAt
        : undefined;

    // Verify credentials by fetching user info
    try {
      const response = await this.usersApi.userGet();
      const user = response.data;

      if (context.globalOptions.json) {
        const jsonOutput: Record<string, unknown> = {
          authenticated: true,
          account,
          accounts,
          method: authMethod,
          user: {
            username: user.username,
            displayName: user.display_name,
            accountId: user.account_id,
          },
          defaultWorkspace: config.defaultWorkspace,
        };
        if (expiresAt) {
          jsonOutput.tokenExpiresAt = expiresAt;
        }
        await this.output.json(jsonOutput);
        return;
      }

      this.output.success('Logged in to Bitbucket');
      if (accounts.length > 1) {
        this.output.text(`  Account: ${this.output.highlight(account)}`);
      }
      this.output.text(
        `  Authentication: ${this.output.highlight(authMethod === 'oauth' ? 'OAuth' : 'API Token')}`
      );
      this.output.text(
        `  Username: ${this.output.highlight(user.username ?? '')}`
      );
      this.output.text(`  Display name: ${user.display_name}`);
      this.output.text(`  Account ID: ${user.account_id}`);

      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          const hours = Math.floor(expiresIn / 3600);
          const minutes = Math.floor((expiresIn % 3600) / 60);
          const parts = [];
          if (hours > 0) parts.push(`${hours}h`);
          parts.push(`${minutes}m`);
          this.output.text(`  Token expires: in ${parts.join(' ')}`);
        } else {
          this.output.text(
            `  Token expires: ${this.output.yellow('expired (will refresh automatically)')}`
          );
        }
      }

      if (config.defaultWorkspace) {
        this.output.text(
          `  Default workspace: ${this.output.highlight(config.defaultWorkspace)}`
        );
      }
      this.printOtherAccounts(otherAccounts);
    } catch (error) {
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: `Authentication is invalid or expired. Run ${this.output.highlight('bb auth login')} to re-authenticate.`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private printOtherAccounts(names: string[]): void {
    if (names.length === 0) {
      return;
    }
    this.output.text(
      `  Other accounts: ${names.join(', ')} (switch with ${this.output.highlight('bb auth switch <account>')})`
    );
  }
}
