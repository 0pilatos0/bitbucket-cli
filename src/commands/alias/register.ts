import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerAliasCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const aliasCmd = new Command('alias').description(
    'Create shortcuts for bb commands'
  );

  aliasCmd
    .command('set <name> <expansion>')
    .description(
      'Create or update an alias; supports $1-$9 placeholders and a ! prefix for shell passthrough'
    )
    .addHelpText(
      'before',
      '\nAn alias expands in place of the first bb argument: `bb co 42` runs\n' +
        '`bb pr checkout 42` after `bb alias set co "pr checkout $1"`. Extra\n' +
        'arguments are appended unless consumed by $1-$9 placeholders. A `!`\n' +
        'prefix runs the expansion through `sh -c` instead, with the remaining\n' +
        'arguments available as shell positional parameters ($1, $@).\n'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb alias set co "pr checkout $1"',
          'bb alias set prd "pr create --draft"',
          'bb alias set openpr \'!bb pr list --json --jq ".pullRequests[0].id" | xargs bb browse --pr\'',
        ],
        seeAlso: [
          {
            label: 'Configuration File',
            url: 'https://bitbucket-cli.paulvanderlei.com/reference/configuration/',
          },
        ],
      })
    )
    .action(async (name, expansion) => {
      await registrar.run(ServiceTokens.SetAliasCommand, { name, expansion });
    });

  aliasCmd
    .command('list')
    .description('List configured aliases')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb alias list', 'bb alias list --json'],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.ListAliasesCommand);
    });

  aliasCmd
    .command('delete <name>')
    .description('Delete an alias')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb alias delete co', 'bb alias delete co --json'],
      })
    )
    .action(async (name) => {
      await registrar.run(ServiceTokens.DeleteAliasCommand, { name });
    });

  parent.addCommand(aliasCmd);
}
