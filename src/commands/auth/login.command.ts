/**
 * Login command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  ICredentialStore,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { UsersApi } from '../../generated/api.js';
import type { OAuthService } from '../../services/oauth.service.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface LoginOptions {
  username?: string;
  password?: string;
  appPassword?: boolean;
  clientId?: string;
  clientSecret?: string;
}

export class LoginCommand extends BaseCommand<LoginOptions, void> {
  public readonly name = 'login';
  public readonly description = 'Authenticate with Bitbucket';

  constructor(
    private readonly credentialStore: ICredentialStore,
    private readonly usersApi: UsersApi,
    private readonly oauthService: OAuthService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: LoginOptions,
    context: CommandContext
  ): Promise<void> {
    const useAppPassword =
      options.appPassword ||
      options.username !== undefined ||
      options.password !== undefined ||
      process.env.BB_API_TOKEN !== undefined;

    if (useAppPassword) {
      return this.loginWithApiToken(options, context);
    }

    return this.loginWithOAuth(options, context);
  }

  private async loginWithOAuth(
    options: LoginOptions,
    context: CommandContext
  ): Promise<void> {
    this.output.info('Opening browser to authenticate with Bitbucket...');

    try {
      const userInfo = await this.oauthService.authorize(
        options.clientId,
        options.clientSecret
      );

      if (context.globalOptions.json) {
        this.output.json({
          authenticated: true,
          method: 'oauth',
          user: {
            username: userInfo.username,
            displayName: userInfo.displayName,
            accountId: userInfo.accountId,
          },
        });
        return;
      }

      this.output.success(
        `Logged in as ${userInfo.displayName} (${userInfo.username})`
      );
    } catch (error) {
      await this.credentialStore.clearOAuthCredentials();
      throw error;
    }
  }

  private async loginWithApiToken(
    options: LoginOptions,
    context: CommandContext
  ): Promise<void> {
    const username = options.username || process.env.BB_USERNAME;
    const apiToken = options.password || process.env.BB_API_TOKEN;

    if (!username) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'Username is required. Use --username option or set BB_USERNAME environment variable.',
      });
    }

    if (!apiToken) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'API token is required. Use --password option or set BB_API_TOKEN environment variable.',
      });
    }

    // Clear any existing OAuth credentials first
    await this.credentialStore.clearOAuthCredentials();
    await this.credentialStore.setCredentials({ username, apiToken });

    try {
      const response = await this.usersApi.userGet();
      const user = response.data;

      if (context.globalOptions.json) {
        this.output.json({
          authenticated: true,
          method: 'api_token',
          user: {
            username: user.username,
            displayName: user.display_name,
            accountId: user.account_id,
          },
        });
        return;
      }

      this.output.success(
        `Logged in as ${user.display_name} (${user.username})`
      );
    } catch (error) {
      await this.credentialStore.clearCredentials();
      throw new BBError({
        code: ErrorCode.AUTH_INVALID,
        message: `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}
