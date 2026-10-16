import { Command } from 'commander';
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

  parent.addCommand(mergeQueueCmd);
}
