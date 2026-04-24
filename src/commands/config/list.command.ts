/**
 * List config command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  coerceBooleanConfigValue,
  coerceVersionCheckIntervalValue,
} from '../../types/config.js';

export interface ConfigDisplay {
  username?: string;
  defaultWorkspace?: string;
  apiToken?: string;
  skipVersionCheck?: boolean;
  versionCheckInterval?: number;
  prCreateIncludeDefaultReviewers?: boolean;
}

export class ListConfigCommand extends BaseCommand<void, void> {
  public readonly name = 'list';
  public readonly description = 'List all configuration values';

  constructor(
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const config = await this.configService.getConfig();

    // Build display config with masked password
    const displayConfig: ConfigDisplay = {};
    if (config.username) {
      displayConfig.username = config.username;
    }

    if (config.defaultWorkspace) {
      displayConfig.defaultWorkspace = config.defaultWorkspace;
    }

    if (config.apiToken) {
      displayConfig.apiToken = '********';
    }

    const skipVersionCheck = coerceBooleanConfigValue(
      config.skipVersionCheck as unknown
    );
    if (skipVersionCheck !== undefined) {
      displayConfig.skipVersionCheck = skipVersionCheck;
    }

    const versionCheckInterval = coerceVersionCheckIntervalValue(
      config.versionCheckInterval as unknown
    );
    if (versionCheckInterval !== undefined) {
      displayConfig.versionCheckInterval = versionCheckInterval;
    }

    const prCreateIncludeDefaultReviewers = coerceBooleanConfigValue(
      config.prCreateIncludeDefaultReviewers as unknown
    );
    if (prCreateIncludeDefaultReviewers !== undefined) {
      displayConfig.prCreateIncludeDefaultReviewers =
        prCreateIncludeDefaultReviewers;
    }

    if (context.globalOptions.json) {
      await this.output.json({
        configPath: this.configService.getConfigPath(),
        config: displayConfig,
      });
      return;
    }

    this.output.text(
      this.output.dim(`Config file: ${this.configService.getConfigPath()}`)
    );
    this.output.text('');

    const rows = Object.entries(displayConfig).map(([key, value]) => [
      key,
      String(value),
    ]);

    if (rows.length === 0) {
      this.output.text('No configuration set');
      return;
    }

    this.output.table(['KEY', 'VALUE'], rows);
  }
}
