/**
 * Print completion script command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import {
  renderCompletionScript,
  type CompletionShell,
} from '../../completion-install.js';

export interface PrintCompletionOptions {
  shell: CompletionShell;
}

export class PrintCompletionCommand extends BaseCommand<
  PrintCompletionOptions,
  void
> {
  public readonly name = 'print';
  public readonly description = 'Print the shell completion script';

  constructor(output: IOutputService) {
    super(output);
  }

  public async execute(
    options: PrintCompletionOptions,
    context: CommandContext
  ): Promise<void> {
    const script = renderCompletionScript(options.shell, {
      name: 'bb',
      completer: 'bb',
    });

    if (context.globalOptions.json) {
      await this.output.json({ shell: options.shell, script });
      return;
    }

    this.output.text(script.replace(/\n$/, ''));
  }
}
