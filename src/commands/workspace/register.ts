import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerWorkspaceCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const workspaceCmd = new Command('workspace').description(
    'Discover and inspect Bitbucket workspaces'
  );

  workspaceCmd
    .command('list')
    .description('List workspaces you are a member of')
    .option('--limit <number>', 'Maximum number of workspaces to list', '25')
    .option('--all', 'List all workspaces (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb workspace list',
          "bb workspace list --json --jq '.workspaces[].slug'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListWorkspacesCommand,
        options
      );
    });

  workspaceCmd
    .command('view [slug]')
    .description(
      'View workspace details (defaults to the current workspace context)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb workspace view',
          'bb workspace view my-workspace',
          "bb workspace view my-workspace --json --jq '.workspace.uuid'",
        ],
        defaults: {
          slug: 'resolved workspace (-w, current repo, BB_WORKSPACE, or defaultWorkspace)',
        },
      })
    )
    .action(async (slug, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewWorkspaceCommand, {
        slug,
        ...options,
      });
    });

  parent.addCommand(workspaceCmd);
}
