import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerProjectCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const projectCmd = new Command('project').description(
    'Manage projects in a workspace'
  );

  projectCmd
    .command('list')
    .description('List projects in a workspace')
    .option('--limit <number>', 'Maximum number of projects to list', '25')
    .option('--all', 'List all projects (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb project list',
          'bb project list -w my-workspace',
          "bb project list --json --jq '.projects[].key'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListProjectsCommand,
        options
      );
    });

  projectCmd
    .command('view <key>')
    .description('View project details')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb project view PROJ',
          'bb project view PROJ -w my-workspace',
          "bb project view PROJ --json --jq '.project.name'",
        ],
      })
    )
    .action(async (key, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewProjectCommand, {
        key,
        ...options,
      });
    });

  projectCmd
    .command('create')
    .description('Create a new project in a workspace')
    .option('-k, --key <key>', 'Project key, e.g. PROJ (required; uppercased)')
    .option('-n, --name <name>', 'Project name (required)')
    .option('-d, --description <description>', 'Project description')
    .option('--private', 'Create a private project (default)')
    .option('--public', 'Create a public project')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb project create --key PROJ --name "My Project"',
          'bb project create -k PROJ -n "My Project" -d "Team things" --public',
          'bb project create -k PROJ -n "My Project" --json --jq \'.project.key\'',
        ],
        defaults: { private: 'true (visibility is private unless --public)' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.CreateProjectCommand,
        options
      );
    });

  parent.addCommand(projectCmd);
}
