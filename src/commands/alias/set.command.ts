/**
 * Set alias command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  isReservedCommandName,
  isShellAlias,
  isValidAliasName,
  splitShellWords,
} from '../../alias.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class SetAliasCommand extends BaseCommand<
  { name: string; expansion: string },
  void
> {
  public readonly name = 'set';
  public readonly description = 'Create or update a command alias';

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { name: string; expansion: string },
    context: CommandContext
  ): Promise<void> {
    const { name, expansion } = options;

    if (!isValidAliasName(name)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `Invalid alias name '${name}'. Use a letter followed by letters, digits, '-' or '_'.`,
        context: { name },
      });
    }

    if (isReservedCommandName(name)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `Cannot use '${name}' as an alias name: it is a built-in bb command.`,
        context: { name },
      });
    }

    if (expansion.trim() === '') {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'Alias expansion cannot be empty.',
        context: { name },
      });
    }

    // Surface unclosed quotes at definition time; shell aliases are passed to
    // `sh -c` verbatim, so only command aliases are pre-tokenized here.
    if (!isShellAlias(expansion)) {
      splitShellWords(expansion);
    }

    const aliases = (await this.configService.getValue('aliases')) ?? {};

    // Own properties only: a name like 'toString' must never read a value
    // through the prototype chain.
    const previous = Object.prototype.hasOwnProperty.call(aliases, name)
      ? aliases[name]
      : undefined;
    await this.configService.setValue('aliases', {
      ...aliases,
      [name]: expansion,
    });

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        name,
        expansion,
        ...(previous !== undefined && { previous }),
      });
      return;
    }

    if (previous !== undefined) {
      this.output.success(
        `Changed alias '${name}' = ${expansion} (was: ${previous})`
      );
    } else {
      this.output.success(`Added alias '${name}' = ${expansion}`);
    }
  }
}
