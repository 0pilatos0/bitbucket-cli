import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerConfigCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const configCmd = new Command('config').description('Manage configuration');

  configCmd
    .command('get <key>')
    .description('Get a configuration value')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb config get defaultWorkspace'],
        validValues: {
          'Readable config keys': [
            'username',
            'defaultWorkspace',
            'skipVersionCheck',
            'versionCheckInterval',
            'prCreateIncludeDefaultReviewers',
          ],
        },
      })
    )
    .action(async (key) => {
      await registrar.run(ServiceTokens.GetConfigCommand, { key });
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb config set defaultWorkspace my-workspace',
          'bb config set skipVersionCheck true',
          'bb config set versionCheckInterval 86400',
        ],
        validValues: {
          'Settable config keys': [
            'defaultWorkspace (string)',
            'skipVersionCheck (true/false)',
            'versionCheckInterval (positive integer, seconds)',
            'prCreateIncludeDefaultReviewers (true/false)',
          ],
        },
        seeAlso: [
          {
            label: 'Configuration File',
            url: 'https://bitbucket-cli.paulvanderlei.com/reference/configuration/',
          },
        ],
      })
    )
    .action(async (key, value) => {
      await registrar.run(ServiceTokens.SetConfigCommand, { key, value });
    });

  configCmd
    .command('list')
    .description('List all configuration values')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb config list', 'bb config list --json'],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.ListConfigCommand);
    });

  parent.addCommand(configCmd);
}
