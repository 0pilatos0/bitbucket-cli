/**
 * List aliases command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';

export class ListAliasesCommand extends BaseCommand<undefined, void> {
  public readonly name = 'list';
  public readonly description = 'List command aliases';

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    _options: undefined,
    context: CommandContext
  ): Promise<void> {
    const aliases = (await this.configService.getValue('aliases')) ?? {};
    const entries = Object.entries(aliases).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    if (context.globalOptions.json) {
      await this.output.json({
        count: entries.length,
        aliases: Object.fromEntries(entries),
      });
      return;
    }

    if (entries.length === 0) {
      this.output.info(
        "No aliases configured. Add one with 'bb alias set <name> <expansion>'."
      );
      return;
    }

    this.output.table(
      ['Alias', 'Expansion'],
      entries.map(([name, expansion]) => [name, expansion])
    );
  }
}
