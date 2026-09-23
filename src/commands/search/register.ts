import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerSearchCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const searchCmd = new Command('search').description('Search Bitbucket');

  searchCmd
    .command('code <query...>')
    .description(
      'Search code in a workspace (code search must be enabled for it); -r scopes to one repository'
    )
    .option('--limit <number>', 'Maximum number of results to list', '25')
    .option('--all', 'List all results (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb search code parseConfig',
          'bb search code parseConfig -r my-repo',
          'bb search code TODO lang:typescript -w my-workspace --limit 50',
          "bb search code parseConfig --json --jq '.results[].file.path'",
        ],
        defaults: { limit: '25' },
        seeAlso: [
          {
            label: 'Search syntax',
            url: 'https://support.atlassian.com/bitbucket-cloud/docs/search-in-bitbucket-cloud/',
          },
        ],
      })
    )
    .action(async (query, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.SearchCodeCommand, {
        query,
        ...options,
      });
    });

  parent.addCommand(searchCmd);
}
