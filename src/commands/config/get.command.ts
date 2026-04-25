/**
 * Get config command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  isReadableConfigKey,
  normalizeReadableConfigValue,
  READABLE_CONFIG_KEYS,
} from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export class GetConfigCommand extends BaseCommand<{ key: string }, void> {
  public readonly name = 'get';
  public readonly description = 'Get a configuration value';

  private static readonly HIDDEN_KEYS = ['apiToken'];

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { key: string },
    context: CommandContext
  ): Promise<void> {
    const { key } = options;

    // Check if key is hidden
    if (GetConfigCommand.HIDDEN_KEYS.includes(key)) {
      throw new BBError({
        code: ErrorCode.CONFIG_INVALID_KEY,
        message:
          `Cannot display '${key}' - it is part of your authentication credentials, not config. ` +
          `Use 'bb auth token' to retrieve credentials, or run 'bb config list' to see readable keys.`,
        context: { key },
      });
    }

    // Check if key is valid
    if (!isReadableConfigKey(key)) {
      throw new BBError({
        code: ErrorCode.CONFIG_INVALID_KEY,
        message: `Unknown config key '${key}'. Valid keys: ${READABLE_CONFIG_KEYS.join(', ')}`,
        context: { key },
      });
    }

    const rawValue = await this.configService.getValue(key);
    const value = normalizeReadableConfigValue(key, rawValue as unknown);

    if (context.globalOptions.json) {
      await this.output.json({
        key,
        value: value ?? null,
      });
      return;
    }

    // Output the value (or empty string if undefined)
    this.output.text(String(value ?? ''));
  }
}
