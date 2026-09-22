import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import { withCompletionChoices } from '../../core/command-options.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { COMMIT_STATUS_STATES } from './shared.js';

export function registerStatusCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const statusCmd = new Command('status').description(
    'Manage build statuses on commits'
  );

  statusCmd
    .command('list <sha>')
    .description('List build statuses reported on a commit')
    .option('--limit <number>', 'Maximum number of statuses to list', '25')
    .option('--all', 'List all statuses (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb status list abc1234',
          'bb status list abc1234 --all',
          "bb status list abc1234 --json --jq '.statuses[].state'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (sha, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListCommitStatusesCommand,
        { sha, ...options }
      );
    });

  statusCmd
    .command('set <sha>')
    .description(
      'Create or update a build status on a commit (idempotent per --key)'
    )
    .option('--key <key>', 'Unique status key, e.g. BB-DEPLOY (required)')
    .addOption(
      withCompletionChoices(
        new Option('--state <state>', 'Status state (required)'),
        COMMIT_STATUS_STATES
      )
    )
    .option('--url <url>', 'Link back to the build system')
    .option('--name <name>', 'Build identifier, e.g. BB-DEPLOY-1')
    .option('--description <description>', 'Short build description')
    .option('--refname <refname>', 'Ref the build ran on, e.g. a branch name')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb status set abc1234 --key CI --state INPROGRESS',
          'bb status set abc1234 --key CI --state SUCCESSFUL --url https://ci.example.com/builds/42',
          'bb status set abc1234 --key CI --state FAILED --description "Unit tests failed" --refname main',
          "bb status set abc1234 --key CI --state SUCCESSFUL --json --jq '.status.state'",
        ],
        validValues: { 'Valid states': [...COMMIT_STATUS_STATES] },
      })
    )
    .action(async (sha, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.SetCommitStatusCommand,
        { sha, ...options }
      );
    });

  parent.addCommand(statusCmd);
}
