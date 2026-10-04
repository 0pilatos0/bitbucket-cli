import type { Command } from 'commander';
import { ServiceTokens } from '../core/container.js';
import type { CommandRegistrar } from '../core/command-registrar.js';

export function registerAgentInstructionsCommand(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  parent
    .command('agent-instructions')
    .description(
      'Print instructions for AI coding agents that use bb, matching this version (paste into a skill or AGENTS.md)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb agent-instructions',
          'bb agent-instructions >> AGENTS.md',
          "bb agent-instructions --json --jq '.instructions'",
        ],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.AgentInstructionsCommand);
    });
}
