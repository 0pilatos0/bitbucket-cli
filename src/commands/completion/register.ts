import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import {
  COMPLETION_SHELLS,
  type CompletionShell,
} from '../../completion-install.js';

const LOAD_EXAMPLES: Record<CompletionShell, string> = {
  bash: "echo 'source <(bb completion bash)' >> ~/.bashrc",
  zsh: "echo 'source <(bb completion zsh)' >> ~/.zshrc",
  fish: 'bb completion fish > ~/.config/fish/completions/bb.fish',
  powershell:
    "Add-Content $PROFILE 'bb completion powershell | Out-String | Invoke-Expression'",
};

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

  for (const shell of COMPLETION_SHELLS) {
    completionCmd
      .command(shell)
      .description(`Print the completion script for ${shell}`)
      .addHelpText(
        'after',
        buildHelpText({
          examples: [`bb completion ${shell}`, LOAD_EXAMPLES[shell]],
        })
      )
      .action(async () => {
        await registrar.run(ServiceTokens.PrintCompletionCommand, { shell });
      });
  }

  parent.addCommand(completionCmd);
}
