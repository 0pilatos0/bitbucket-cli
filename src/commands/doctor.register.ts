import type { Command } from 'commander';
import { ServiceTokens } from '../core/container.js';
import type { CommandRegistrar } from '../core/command-registrar.js';

export function registerDoctorCommand(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  parent
    .command('doctor')
    .description(
      'Check auth, token scopes, network, config, git remote and Bun runtime'
    )
    .addHelpText(
      'before',
      '\nEach check reports pass, warn or fail. Exits 1 when any check fails.\n'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb doctor',
          'bb doctor --json',
          'bb doctor --json --jq \'.checks[] | select(.status != "pass")\'',
        ],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.DoctorCommand);
    });
}
