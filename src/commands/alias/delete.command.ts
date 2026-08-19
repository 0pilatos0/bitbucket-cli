/**
 * Delete alias command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class DeleteAliasCommand extends BaseCommand<{ name: string }, void> {
  public readonly name = 'delete';
  public readonly description = 'Delete a command alias';

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { name: string },
    context: CommandContext
  ): Promise<void> {
    const { name } = options;
    const aliases = (await this.configService.getValue('aliases')) ?? {};

    if (aliases[name] === undefined) {
      throw new BBError({
        code: ErrorCode.CONFIG_INVALID_KEY,
        message: `No alias named '${name}'. Run 'bb alias list' to see configured aliases.`,
        context: { name },
      });
    }

    const { [name]: expansion, ...rest } = aliases;
    await this.configService.setValue('aliases', rest);

    if (context.globalOptions.json) {
      await this.output.json({ success: true, name, expansion });
      return;
    }

    this.output.success(`Deleted alias '${name}' (was: ${expansion})`);
  }
}
