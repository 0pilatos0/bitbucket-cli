/**
 * Logout command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  ICredentialStore,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { OAuthService } from '../../services/oauth.service.js';

export class LogoutCommand extends BaseCommand<void, void> {
  public readonly name = 'logout';
  public readonly description = 'Log out of Bitbucket';

  constructor(
    private readonly credentialStore: ICredentialStore,
    private readonly oauthService: OAuthService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const authMethod = await this.credentialStore.getAuthMethod();

    if (authMethod === 'oauth') {
      await this.oauthService.revokeToken();
      await this.credentialStore.clearOAuthCredentials();
    } else {
      await this.credentialStore.clearCredentials();
    }

    if (context.globalOptions.json) {
      await this.output.json({ authenticated: false, success: true });
      return;
    }

    this.output.success('Logged out of Bitbucket');
  }
}
