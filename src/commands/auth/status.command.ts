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
import { BBError, ErrorCode } from '../../types/errors.js';

export interface AuthStatus {
  authenticated: boolean;
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

    // Check if any credentials exist
    const hasBasicAuth = config.username && config.apiToken;
    const hasOAuth = config.oauthAccessToken && config.oauthRefreshToken;

    if (!hasBasicAuth && !hasOAuth) {
      if (context.globalOptions.json) {
        this.output.json({ authenticated: false });
        return;
      }

      this.output.info('Not logged in');
      this.output.text(
        `Run ${this.output.highlight('bb auth login')} to authenticate.`
      );
      return;
    }

    // Verify credentials by fetching user info
    try {
      const response = await this.usersApi.userGet();
      const user = response.data;

      if (context.globalOptions.json) {
        const jsonOutput: Record<string, unknown> = {
          authenticated: true,
          method: authMethod,
          user: {
            username: user.username,
            displayName: user.display_name,
            accountId: user.account_id,
          },
          defaultWorkspace: config.defaultWorkspace,
        };
        if (authMethod === 'oauth' && config.oauthExpiresAt) {
          jsonOutput.tokenExpiresAt = config.oauthExpiresAt;
        }
        this.output.json(jsonOutput);
        return;
      }

      this.output.success('Logged in to Bitbucket');
      this.output.text(
        `  Authentication: ${this.output.highlight(authMethod === 'oauth' ? 'OAuth' : 'API Token')}`
      );
      this.output.text(
        `  Username: ${this.output.highlight(user.username ?? '')}`
      );
      this.output.text(`  Display name: ${user.display_name}`);
      this.output.text(`  Account ID: ${user.account_id}`);

      if (authMethod === 'oauth' && config.oauthExpiresAt) {
        const expiresIn = config.oauthExpiresAt - Math.floor(Date.now() / 1000);
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
    } catch (error) {
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: `Authentication is invalid or expired. Run ${this.output.highlight('bb auth login')} to re-authenticate.`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
