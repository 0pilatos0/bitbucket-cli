import { Command } from 'commander';
import { DRY_RUN_DESCRIPTION } from '../../core/command-options.js';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerMergeQueueCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const mergeQueueCmd = new Command('merge-queue').description(
    'Manage merge queues'
  );

  mergeQueueCmd
    .command('list')
    .description('List merge queues in a repository')
    .option('--limit <number>', 'Maximum number of items to list', '25')
    .option('--all', 'List all items (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb merge-queue list', 'bb merge-queue list --json'],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListMergeQueuesCommand,
        options
      );
    });

  mergeQueueCmd
    .command('view <uuid>')
    .description('View a merge queue')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb merge-queue view {a1b2c3d4-0000-0000-0000-000000000000}',
          'bb merge-queue view a1b2c3d4-0000-0000-0000-000000000000 --json',
        ],
      })
    )
    .action(async (uuid, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ViewMergeQueueCommand,
        { uuid, ...options }
      );
    });

  mergeQueueCmd
    .command('prs <uuid>')
    .description('List pull requests in a merge queue')
    .option('--limit <number>', 'Maximum number of items to list', '25')
    .option('--all', 'List all items (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb merge-queue prs {a1b2c3d4-0000-0000-0000-000000000000}',
          'bb merge-queue prs a1b2c3d4-0000-0000-0000-000000000000 --all --json',
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (uuid, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListMergeQueuePullRequestsCommand,
        { uuid, ...options }
      );
    });

  mergeQueueCmd
    .command('remove <uuid> <pr-id>')
    .description('Remove a pull request from a merge queue')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb merge-queue remove {a1b2c3d4-0000-0000-0000-000000000000} 42',
          'bb merge-queue remove a1b2c3d4-0000-0000-0000-000000000000 42 --yes',
        ],
      })
    )
    .action(async (uuid, prId, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.RemoveMergeQueuePullRequestCommand,
        { uuid, prId, ...options }
      );
    });

  parent.addCommand(mergeQueueCmd);
}
