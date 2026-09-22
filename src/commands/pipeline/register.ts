import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import { withCompletionChoices } from '../../core/command-registrar.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import {
  DEFAULT_PIPELINE_SORT,
  PIPELINE_SORTS,
  PIPELINE_STATUSES,
} from './list.command.js';

export function registerPipelineCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const pipelineCmd = new Command('pipeline').description(
    'Manage Bitbucket Pipelines (CI/CD)'
  );

  pipelineCmd
    .command('list')
    .description('List pipelines for a repository')
    .addOption(
      withCompletionChoices(
        new Option('--status <status>', 'Filter by pipeline status'),
        PIPELINE_STATUSES
      )
    )
    .option('--branch <branch>', 'Filter by target branch')
    .addOption(
      withCompletionChoices(
        new Option(
          '--sort <attribute>',
          'Sort attribute (prefix with - for descending)'
        ),
        PIPELINE_SORTS
      )
    )
    .option('--limit <number>', 'Maximum number of pipelines to list', '25')
    .option('--all', 'List all pipelines (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pipeline list',
          'bb pipeline list --status FAILED',
          'bb pipeline list --branch main --limit 50',
          "bb pipeline list --json --jq '.pipelines[].build_number'",
        ],
        validValues: {
          'Valid statuses': [...PIPELINE_STATUSES],
          'Valid sort attributes': [...PIPELINE_SORTS],
        },
        defaults: { limit: '25', sort: DEFAULT_PIPELINE_SORT },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListPipelinesCommand,
        options
      );
    });

  pipelineCmd
    .command('view <id>')
    .description(
      'View pipeline details and step summary (id: build number or UUID)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pipeline view 42',
          'bb pipeline view {a1b2c3d4-0000-0000-0000-000000000000}',
          "bb pipeline view 42 --json --jq '.pipeline.state'",
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewPipelineCommand, {
        id,
        ...options,
      });
    });

  pipelineCmd
    .command('run')
    .description('Trigger a pipeline run')
    .option(
      '-b, --branch <branch>',
      'Branch to run on (default: current git branch)'
    )
    .option('--commit <hash>', 'Run against a specific commit on the branch')
    .option(
      '-p, --pipeline <name>',
      'Custom pipeline definition to run (from bitbucket-pipelines.yml)'
    )
    .option(
      '--var <key=value...>',
      'Pipeline variable (repeatable; value may contain =)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pipeline run',
          'bb pipeline run --branch main',
          'bb pipeline run --pipeline deploy-prod --var ENV=prod --var DRY_RUN=false',
          "bb pipeline run --branch main --json --jq '.build_number'",
        ],
        defaults: { branch: 'current git branch' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.RunPipelineCommand,
        options
      );
    });

  pipelineCmd
    .command('stop <id>')
    .description('Stop a running pipeline (id: build number or UUID)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pipeline stop 42',
          'bb pipeline stop {a1b2c3d4-0000-0000-0000-000000000000} --json',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.StopPipelineCommand, {
        id,
        ...options,
      });
    });

  pipelineCmd
    .command('logs <id>')
    .description('Print the log of a pipeline step (id: build number or UUID)')
    .option(
      '-s, --step <uuid-or-index>',
      'Step to fetch (UUID or 1-based index; default: the only step)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pipeline logs 42',
          'bb pipeline logs 42 --step 2',
          'bb pipeline logs 42 --step {step-uuid}',
          "bb pipeline logs 42 --json --jq '.log'",
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.LogsPipelineCommand, {
        id,
        ...options,
      });
    });

  parent.addCommand(pipelineCmd);
}
