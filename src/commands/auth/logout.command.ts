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
    const account = await this.credentialStore.getAccountName();
    const wasActive = (await this.credentialStore.listAccounts()).some(
      (summary) => summary.name === account && summary.active
    );
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

    // Like `gh`, fall back to another saved account rather than leaving the
    // active one pointing at the account just removed.
    const next = (await this.credentialStore.listAccounts()).find(
      (summary) => summary.name !== account
    );
    const switchedTo = wasActive ? next?.name : undefined;
    if (switchedTo) {
      await this.credentialStore.switchAccount(switchedTo);
    }

    if (context.globalOptions.json) {
      await this.output.json({
        authenticated: false,
        success: true,
        account,
        switchedTo,
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
    if (switchedTo) {
      this.output.text(
        `  Active account is now ${this.output.highlight(switchedTo)}`
      );
    }
  }
}
