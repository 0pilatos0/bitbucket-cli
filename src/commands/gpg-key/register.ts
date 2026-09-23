import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerGpgKeyCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const gpgKeyCmd = new Command('gpg-key').description(
    'Manage GPG keys on your Bitbucket account'
  );

  gpgKeyCmd
    .command('list')
    .description('List GPG keys on your account')
    .option('--limit <number>', 'Maximum number of keys to list', '25')
    .option('--all', 'List all keys (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb gpg-key list',
          "bb gpg-key list --json --jq '.gpgKeys[].fingerprint'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.run(ServiceTokens.ListGpgKeysCommand, options);
    });

  gpgKeyCmd
    .command('add <key-file>')
    .description(
      'Add an ASCII-armored GPG public key to your account (- reads stdin)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb gpg-key add key.asc',
          'gpg --armor --export you@example.com | bb gpg-key add -',
        ],
      })
    )
    .action(async (keyFile) => {
      await registrar.run(ServiceTokens.AddGpgKeyCommand, { keyFile });
    });

  gpgKeyCmd
    .command('delete <fingerprint>')
    .description('Delete a GPG key from your account')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb gpg-key delete 3F2A9C1B7E5D4A60B8C2E1F09D7A6B5C4E3F2A1B',
          'bb gpg-key delete 3F2A9C1B7E5D4A60B8C2E1F09D7A6B5C4E3F2A1B --yes',
        ],
      })
    )
    .action(async (fingerprint, options) => {
      await registrar.run(ServiceTokens.DeleteGpgKeyCommand, {
        fingerprint,
        ...options,
      });
    });

  parent.addCommand(gpgKeyCmd);
}
