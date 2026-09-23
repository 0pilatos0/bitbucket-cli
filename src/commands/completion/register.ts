import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerCompletionCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const completionCmd = new Command('completion').description(
    'Shell completion utilities'
  );

  completionCmd
    .command('install')
    .description('Install shell completions for bash, zsh, or fish')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb completion install', 'bb completion install --json'],
        validValues: {
          'Supported shells': ['bash', 'zsh', 'fish'],
        },
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.InstallCompletionCommand);
    });

  completionCmd
    .command('uninstall')
    .description('Uninstall shell completions')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb completion uninstall', 'bb completion uninstall --json'],
        validValues: {
          'Supported shells': ['bash', 'zsh', 'fish'],
        },
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.UninstallCompletionCommand);
    });

  parent.addCommand(completionCmd);
}
