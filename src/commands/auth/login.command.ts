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
import { APIError, BBError, ErrorCode } from '../../types/errors.js';

export interface LoginOptions {
  username?: string;
  password?: string;
  appPassword?: boolean;
  withToken?: boolean;
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
      options.withToken ||
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
        await this.output.json({
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

    if (!username) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'Username is required. Use --username option or set BB_USERNAME environment variable.',
      });
    }

    const apiToken = await this.resolveApiToken(options);

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
        await this.output.json({
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
      throw this.wrapLoginError(error);
    }
  }

  /**
   * Resolve the API token for the app-password flow. With `--with-token` the
   * token is read from stdin so it never appears in shell history, `ps`
   * output, or process args; otherwise it comes from `--password` or the
   * `BB_API_TOKEN` environment variable.
   */
  private async resolveApiToken(
    options: LoginOptions
  ): Promise<string | undefined> {
    if (!options.withToken) {
      return options.password || process.env.BB_API_TOKEN;
    }

    if (options.password !== undefined) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message:
          'Cannot combine --password with --with-token. With --with-token the API token is read from stdin.',
      });
    }

    const token = (await this.readTokenFromStdin()).trim();

    if (!token) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'No API token found on stdin. Pipe a token, e.g. `echo "$BB_API_TOKEN" | bb auth login -u <username> --with-token`.',
      });
    }

    return token;
  }

  /**
   * Read the API token from stdin. Extracted into its own method so tests can
   * stub stdin without a real pipe; mirrors the stdin read in `api.command.ts`.
   */
  protected async readTokenFromStdin(): Promise<string> {
    return Bun.stdin.text();
  }

  private wrapLoginError(error: unknown): BBError {
    const detail = error instanceof Error ? error.message : String(error);

    if (error instanceof APIError) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return new BBError({
          code: ErrorCode.AUTH_INVALID,
          message: `Invalid username or token: ${detail}. Verify your Bitbucket username and that the API token is current and has the required scopes.`,
          cause: error,
        });
      }
      if (error.statusCode === 429) {
        return new BBError({
          code: ErrorCode.API_RATE_LIMITED,
          message: `Bitbucket API rate-limited: ${detail}. Wait a moment and try again.`,
          cause: error,
        });
      }
    }

    return new BBError({
      code: ErrorCode.AUTH_INVALID,
      message: `Authentication failed: ${detail}`,
      cause: error instanceof Error ? error : undefined,
    });
  }
}
