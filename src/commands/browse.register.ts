import type { Command } from 'commander';
import { ServiceTokens } from '../core/container.js';
import type { CommandRegistrar } from '../core/command-registrar.js';

export function registerBrowseCommand(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  parent
    .command('browse [target]')
    .description(
      'Open a Bitbucket page (repo home, file, PR, commit, etc.) in your browser'
    )
    .option('--pr <id>', 'Open a specific pull request')
    .option('--prs', 'Open the pull-requests list')
    .option('--pull-requests', 'Alias for --prs')
    .option(
      '--branch <name>',
      'Open the branch source tree (or, with <target>, that path on the branch)'
    )
    .option('--branches', 'Open the branches list')
    .option(
      '--commit [sha]',
      'Open a specific commit (defaults to HEAD when no SHA is given)'
    )
    .option('--commits', 'Open the commits list')
    .option('--pipelines', 'Open the pipelines page')
    .option('--pipeline <id>', 'Open a specific pipeline run')
    .option('--downloads', 'Open the downloads page')
    .option('--settings', 'Open repository settings')
    .option('-n, --no-browser', 'Print the URL to stdout instead of opening it')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb browse',
          'bb browse src/cli.ts',
          'bb browse src/cli.ts:42',
          'bb browse --branch release/2.0 src/cli.ts',
          'bb browse 217',
          'bb browse --pr 217',
          'bb browse --prs',
          'bb browse abc1234',
          'bb browse --commit',
          'bb browse --pipelines',
          'bb browse --settings',
          'bb browse --pr 217 --no-browser',
          'bb browse --pr 217 --json url',
        ],
      })
    )
    .action(async (target, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.BrowseCommand, {
        target,
        ...options,
      });
    });
}
