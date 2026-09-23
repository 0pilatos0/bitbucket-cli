import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerCommitCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const commitCmd = new Command('commit').description(
    'Inspect commits in a repository'
  );

  commitCmd
    .command('list')
    .description('List commits (defaults to the current git branch)')
    .option(
      '--ref <ref>',
      'Branch, tag, or commit to list history for (default: current git branch, falling back to the repository default listing)'
    )
    .option('--limit <number>', 'Maximum number of commits to list', '25')
    .option('--all', 'List all commits (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb commit list',
          'bb commit list --ref main',
          'bb commit list --ref v1.0.0 --limit 50',
          "bb commit list --json --jq '.commits[].hash'",
        ],
        defaults: {
          ref: 'current git branch (repository default listing outside a git repo)',
          limit: '25',
        },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListCommitsCommand,
        options
      );
    });

  commitCmd
    .command('view <sha>')
    .description('View commit details (author, date, parents, full message)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb commit view abc1234',
          'bb commit view abc1234def5678900000000000000000000000000',
          "bb commit view abc1234 --json --jq '.commit.author.raw'",
        ],
      })
    )
    .action(async (sha, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewCommitCommand, {
        sha,
        ...options,
      });
    });

  parent.addCommand(commitCmd);
}
