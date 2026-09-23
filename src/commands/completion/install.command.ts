/**
 * Install completion command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import { installCompletion } from '../../completion-install.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class InstallCompletionCommand extends BaseCommand<void, void> {
  public readonly name = 'install';
  public readonly description = 'Install shell completions';

  constructor(
    output: IOutputService,
    private readonly install: typeof installCompletion = installCompletion
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    try {
      await this.install({ name: 'bb', completer: 'bb' });

      if (context.globalOptions.json) {
        await this.output.json({
          success: true,
          shellCompletion: {
            command: 'bb',
            installed: true,
          },
        });
        return;
      }

      this.output.success('Shell completions installed successfully!');
      this.output.text(
        'Restart your shell or source your profile to enable completions.'
      );
    } catch (error) {
      throw new BBError({
        code: ErrorCode.COMPLETION_INSTALL_FAILED,
        message: `Failed to install completions: ${error}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
