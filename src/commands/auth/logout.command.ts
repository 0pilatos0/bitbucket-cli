/**
 * Logout command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { OAuthService } from '../../services/oauth.service.js';

export class LogoutCommand extends BaseCommand<void, void> {
  public readonly name = 'logout';
  public readonly description = 'Log out of Bitbucket';

  constructor(
    private readonly configService: IConfigService,
    private readonly oauthService: OAuthService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const authMethod = await this.configService.getAuthMethod();

    if (authMethod === 'oauth') {
      await this.oauthService.revokeToken();
      await this.configService.clearOAuthCredentials();
    } else {
      await this.configService.clearCredentials();
    }

    if (context.globalOptions.json) {
      this.output.json({ authenticated: false, success: true });
      return;
    }

    this.output.success('Logged out of Bitbucket');
  }
}
