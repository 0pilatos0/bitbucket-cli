/**
 * Uninstall completion command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { uninstallCompletion } from '../../completion-install.js';
import { BBError, ErrorCode } from '../../types/errors.js';

// Loaded on demand so tabtab and its prompt stack stay out of every other
// command's startup.
const uninstallCompletionOnDemand: typeof uninstallCompletion = async (name) =>
  (await import('../../completion-install.js')).uninstallCompletion(name);

export class UninstallCompletionCommand extends BaseCommand<void, void> {
  public readonly name = 'uninstall';
  public readonly description = 'Uninstall shell completions';

  constructor(
    output: IOutputService,
    private readonly uninstall: typeof uninstallCompletion = uninstallCompletionOnDemand
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    try {
      await this.uninstall('bb');

      if (context.globalOptions.json) {
        await this.output.json({
          success: true,
          shellCompletion: {
            command: 'bb',
            installed: false,
          },
        });
        return;
      }

      this.output.success('Shell completions uninstalled successfully!');
    } catch (error) {
      throw new BBError({
        code: ErrorCode.COMPLETION_UNINSTALL_FAILED,
        message: `Failed to uninstall completions: ${error}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
