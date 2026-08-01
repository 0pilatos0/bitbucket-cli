/**
 * Set config command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import { didYouMeanSuffix } from '../../core/suggest.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  isSettableConfigKey,
  parseSettableConfigValue,
  SETTABLE_CONFIG_KEYS,
} from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class SetConfigCommand extends BaseCommand<
  { key: string; value: string },
  void
> {
  public readonly name = 'set';
  public readonly description = 'Set a configuration value';

  private static readonly PROTECTED_KEYS = ['username', 'apiToken'];

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { key: string; value: string },
    context: CommandContext
  ): Promise<void> {
    const { key, value } = options;

    // Check if key is protected
    if (SetConfigCommand.PROTECTED_KEYS.includes(key)) {
      throw new BBError({
        code: ErrorCode.CONFIG_INVALID_KEY,
        message: `Cannot set '${key}' directly. Use 'bb auth login' to configure authentication.`,
        context: { key },
      });
    }

    // Check if key is valid
    if (!isSettableConfigKey(key)) {
      throw new BBError({
        code: ErrorCode.CONFIG_INVALID_KEY,
        message:
          `Unknown config key '${key}'. Valid keys: ${SETTABLE_CONFIG_KEYS.join(', ')}` +
          didYouMeanSuffix(key, SETTABLE_CONFIG_KEYS),
        context: { key },
      });
    }

    const parsedValue = parseSettableConfigValue(key, value);

    await this.configService.setValue(key, parsedValue);

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        key,
        value: parsedValue,
      });
      return;
    }

    this.output.success(`Set ${key} = ${parsedValue}`);
  }
}
