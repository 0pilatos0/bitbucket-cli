/**
 * `bb help --json`: the command tree as JSON, for scripts and agents.
 */

import type { Command } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { BaseCommand } from '../core/base-command.js';
import { describeCommandTree } from '../core/command-manifest.js';
import type { CommandManifest } from '../core/command-manifest.js';
import type { IOutputService } from '../core/interfaces/services.js';

export interface HelpCommandOptions {
  /** The command whose subtree to describe (the root for `bb help`). */
  command: Command;
}

export type HelpCommandResult = CommandManifest & { version: string };

export class HelpCommand extends BaseCommand<
  HelpCommandOptions,
  HelpCommandResult
> {
  public readonly name = 'help';
  public readonly description = 'Describe the command tree as JSON';

  constructor(output: IOutputService) {
    super(output);
  }

  public async execute(
    options: HelpCommandOptions
  ): Promise<HelpCommandResult> {
    const result = {
      version: pkg.version,
      ...describeCommandTree(options.command),
    };
    await this.output.json(result);
    return result;
  }
}
