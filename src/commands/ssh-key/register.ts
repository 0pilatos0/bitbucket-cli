import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerSshKeyCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const sshKeyCmd = new Command('ssh-key').description(
    'Manage SSH keys on your Bitbucket account'
  );

  sshKeyCmd
    .command('list')
    .description('List SSH keys on your account')
    .option('--limit <number>', 'Maximum number of keys to list', '25')
    .option('--all', 'List all keys (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb ssh-key list',
          "bb ssh-key list --json --jq '.sshKeys[].fingerprint'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.run(ServiceTokens.ListSshKeysCommand, options);
    });

  sshKeyCmd
    .command('add <key-file>')
    .description('Add an SSH public key to your account (- reads stdin)')
    .option('--label <label>', 'Label for the key')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb ssh-key add ~/.ssh/id_ed25519.pub',
          'bb ssh-key add ~/.ssh/id_ed25519.pub --label laptop',
          'cat ~/.ssh/id_ed25519.pub | bb ssh-key add -',
        ],
      })
    )
    .action(async (keyFile, options) => {
      await registrar.run(ServiceTokens.AddSshKeyCommand, {
        keyFile,
        ...options,
      });
    });

  sshKeyCmd
    .command('delete <key-id>')
    .description('Delete an SSH key from your account (key-id is its {uuid})')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb ssh-key delete "{b15b6026-9c02-4626-b4ad-b905f99f763a}"',
          'bb ssh-key delete "{b15b6026-9c02-4626-b4ad-b905f99f763a}" --yes',
        ],
      })
    )
    .action(async (keyId, options) => {
      await registrar.run(ServiceTokens.DeleteSshKeyCommand, {
        keyId,
        ...options,
      });
    });

  parent.addCommand(sshKeyCmd);
}
