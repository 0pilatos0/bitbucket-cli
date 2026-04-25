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

    let revokeFailed = false;
    if (authMethod === 'oauth') {
      try {
        await this.oauthService.revokeToken();
      } catch {
        revokeFailed = true;
      }
      await this.credentialStore.clearOAuthCredentials();
    } else {
      await this.credentialStore.clearCredentials();
    }

    if (context.globalOptions.json) {
      await this.output.json({
        authenticated: false,
        success: true,
        revokeFailed: revokeFailed || undefined,
      });
      return;
    }

    if (revokeFailed) {
      this.output.warning(
        'Token revocation failed; the access token may still be valid at Bitbucket. Consider revoking it manually.'
      );
    }
    this.output.success('Logged out of Bitbucket');
  }
}
