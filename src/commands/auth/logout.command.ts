/**
 * Logout command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';

export class LogoutCommand extends BaseCommand<void, void> {
  public readonly name = 'logout';
  public readonly description = 'Log out of Bitbucket';

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    await this.configService.clearCredentials();

    if (context.globalOptions.json) {
      this.output.json({ authenticated: false, success: true });
      return;
    }

    this.output.success('Logged out of Bitbucket');
  }
}
