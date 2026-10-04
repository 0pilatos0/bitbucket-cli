import type { Command } from 'commander';
import { ServiceTokens } from '../core/container.js';
import type { CommandRegistrar } from '../core/command-registrar.js';

export function registerContextCommand(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  parent
    .command('context')
    .description(
      'Show the workspace, repository and branch bb would use here, and where each came from (no network)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb context',
          'bb context --json',
          'bb context -w my-team -r api --json',
        ],
      })
    )
    .action(async () => {
      await registrar.runWithGlobalOptions(ServiceTokens.ContextCommand, {});
    });
}
