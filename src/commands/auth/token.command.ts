/**
 * Token command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  ICredentialStore,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { OAuthService } from '../../services/oauth.service.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class TokenCommand extends BaseCommand<void, void> {
  public readonly name = 'token';
  public readonly description = 'Print the current access token';

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
      const accessToken = await this.oauthService.getValidAccessToken();

      if (context.globalOptions.json) {
        this.output.json({ token: accessToken, type: 'bearer' });
        return;
      }

      this.output.text(accessToken);
      return;
    }

    const credentials = await this.credentialStore.getCredentials();

    if (!credentials.username || !credentials.apiToken) {
      throw new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message: "Not authenticated. Run 'bb auth login' first.",
      });
    }

    const token = Buffer.from(
      `${credentials.username}:${credentials.apiToken}`
    ).toString('base64');

    if (context.globalOptions.json) {
      this.output.json({ token, type: 'basic' });
      return;
    }

    this.output.text(token);
  }
}
