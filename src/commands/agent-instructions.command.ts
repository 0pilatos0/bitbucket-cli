/**
 * `bb agent-instructions`: the AI agent rules shipped with this version, the
 * same text the AI agents guide renders.
 */

import pkg from '../../package.json' with { type: 'json' };
import instructions from '../agent-instructions.md' with { type: 'text' };
import { BaseCommand } from '../core/base-command.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import type { IOutputService } from '../core/interfaces/services.js';

export interface AgentInstructionsResult {
  version: string;
  instructions: string;
}

export class AgentInstructionsCommand extends BaseCommand<
  void,
  AgentInstructionsResult
> {
  public readonly name = 'agent-instructions';
  public readonly description =
    'Print instructions for AI coding agents that use bb';

  constructor(output: IOutputService) {
    super(output);
  }

  public async execute(
    _options: void,
    context: CommandContext
  ): Promise<AgentInstructionsResult> {
    const result = { version: pkg.version, instructions };

    if (context.globalOptions.json) {
      await this.output.json(result);
      return result;
    }

    this.output.text(instructions.trimEnd());
    return result;
  }
}
