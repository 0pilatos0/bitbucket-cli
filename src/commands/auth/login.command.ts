/**
 * Login command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  ICredentialStore,
  IOutputService,
  IPromptService,
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
    const method = await this.resolveMethod(options, context.prompt);
    return method === 'api_token'
      ? this.loginWithApiToken(options, context)
      : this.loginWithOAuth(options, context);
  }

  /**
   * Token flags or `BB_API_TOKEN` pick API token auth; OAuth client flags or
   * a non-interactive terminal pick OAuth; otherwise the user chooses.
   */
  private async resolveMethod(
    options: LoginOptions,
    prompt: IPromptService | undefined
  ): Promise<'oauth' | 'api_token'> {
    if (
      options.appPassword ||
      options.withToken ||
      options.username !== undefined ||
      options.password !== undefined ||
      process.env.BB_API_TOKEN !== undefined
    ) {
      return 'api_token';
    }

    if (!prompt || options.clientId || options.clientSecret) {
      return 'oauth';
    }

    return prompt.select('How would you like to authenticate?', [
      { value: 'oauth', label: 'Log in with a web browser (OAuth)' },
      { value: 'api_token', label: 'Paste an API token' },
    ]);
  }

  private async loginWithOAuth(
    options: LoginOptions,
    context: CommandContext
  ): Promise<void> {
    this.output.info('Opening browser to authenticate with Bitbucket...');

    let userInfo;
    try {
      userInfo = await this.oauthService.authorize(
        options.clientId,
        options.clientSecret
      );
    } catch (error) {
      await this.credentialStore.clearOAuthCredentials();
      throw error;
    }

    await this.reportLogin(context, 'oauth', {
      username: userInfo.username,
      displayName: userInfo.displayName,
      accountId: userInfo.accountId,
    });
  }

  private async loginWithApiToken(
    options: LoginOptions,
    context: CommandContext
  ): Promise<void> {
    const { prompt } = context;
    const username =
      options.username ||
      process.env.BB_USERNAME ||
      (await prompt?.text('Atlassian account email', { required: true }));

    if (!username) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'Atlassian account email is required. Use --username or set BB_USERNAME to your email.',
      });
    }

    const apiToken =
      (await this.resolveApiToken(options)) ||
      (await prompt?.secret('API token'));

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

    let user;
    try {
      user = (await this.usersApi.userGet()).data;
    } catch (error) {
      await this.credentialStore.clearCredentials();
      throw this.wrapLoginError(error);
    }

    await this.reportLogin(context, 'api_token', {
      username: user.username,
      displayName: user.display_name,
      accountId: user.account_id,
    });
  }

  /**
   * Make the account just logged into the active one, then report it. The
   * account is only named when there is a choice of accounts.
   */
  private async reportLogin(
    context: CommandContext,
    method: 'oauth' | 'api_token',
    user: { username?: string; displayName?: string; accountId?: string }
  ): Promise<void> {
    const account = await this.credentialStore.getAccountName();
    await this.credentialStore.switchAccount(account);

    if (context.globalOptions.json) {
      await this.output.json({ authenticated: true, method, account, user });
      return;
    }

    this.output.success(`Logged in as ${user.displayName} (${user.username})`);
    if ((await this.credentialStore.listAccounts()).length > 1) {
      this.output.text(`  Active account: ${this.output.highlight(account)}`);
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
          'No API token found on stdin. Pipe a token, e.g. `echo "$BB_API_TOKEN" | bb auth login -u you@example.com --with-token`.',
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
          message: `Invalid email or token: ${detail}. Verify your Atlassian account email and that the API token is current and has the required scopes.`,
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
