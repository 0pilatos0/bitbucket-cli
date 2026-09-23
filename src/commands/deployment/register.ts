import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerDeploymentCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const deploymentCmd = new Command('deployment').description(
    'Inspect Bitbucket Pipelines deployments'
  );

  deploymentCmd
    .command('list')
    .description('List deployments for a repository')
    .option('--limit <number>', 'Maximum number of deployments to list', '25')
    .option('--all', 'List all deployments (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb deployment list',
          'bb deployment list --all',
          "bb deployment list --json --jq '.deployments[].uuid'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListDeploymentsCommand,
        options
      );
    });

  deploymentCmd
    .command('view <uuid>')
    .description('View deployment details')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb deployment view "{a1b2c3d4-0000-0000-0000-000000000000}"',
          'bb deployment view "{a1b2c3d4-0000-0000-0000-000000000000}" --json --jq \'.deployment.state.name\'',
        ],
      })
    )
    .action(async (uuid, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ViewDeploymentCommand,
        { uuid, ...options }
      );
    });

  deploymentCmd
    .command('environments')
    .description('List deployment environments for a repository')
    .option('--limit <number>', 'Maximum number of environments to list', '25')
    .option('--all', 'List all environments (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb deployment environments',
          "bb deployment environments --json --jq '.environments[].name'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListEnvironmentsCommand,
        options
      );
    });

  parent.addCommand(deploymentCmd);
}
