/**
 * Status command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { UsersApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    username: string;
    display_name: string;
    account_id: string;
  };
  defaultWorkspace?: string;
}

export class StatusCommand extends BaseCommand<void, void> {
  public readonly name = 'status';
  public readonly description = 'Show authentication status';

  constructor(
    private readonly configService: IConfigService,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const config = await this.configService.getConfig();

    // Check if credentials exist
    if (!config.username || !config.apiToken) {
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
        this.output.json({
          authenticated: true,
          user: {
            username: user.username,
            displayName: user.display_name,
            accountId: user.account_id,
          },
          defaultWorkspace: config.defaultWorkspace,
        });
        return;
      }

      this.output.success('Logged in to Bitbucket');
      this.output.text(
        `  Username: ${this.output.highlight(user.username ?? '')}`
      );
      this.output.text(`  Display name: ${user.display_name}`);
      this.output.text(`  Account ID: ${user.account_id}`);

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
