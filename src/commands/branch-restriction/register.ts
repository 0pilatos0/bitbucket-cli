import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import {
  collectRepeated,
  withCompletionChoices,
} from '../../core/command-options.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import {
  BRANCH_RESTRICTION_BRANCH_TYPES,
  BRANCH_RESTRICTION_KINDS,
} from './shared.js';

export function registerBranchRestrictionCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const branchRestrictionCmd = new Command('branch-restriction').description(
    'Manage branch restrictions (branch protection) on a repository'
  );

  branchRestrictionCmd
    .command('list')
    .description('List branch restrictions for a repository')
    .addOption(
      withCompletionChoices(
        new Option('--kind <kind>', 'Filter by restriction kind'),
        BRANCH_RESTRICTION_KINDS
      )
    )
    .option('--pattern <glob>', 'Filter by branch pattern')
    .option('--limit <number>', 'Maximum number of restrictions to list', '25')
    .option('--all', 'List all restrictions (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb branch-restriction list',
          'bb branch-restriction list --kind push',
          'bb branch-restriction list --pattern main',
          "bb branch-restriction list --json --jq '.branchRestrictions[].kind'",
        ],
        validValues: { 'Valid kinds': [...BRANCH_RESTRICTION_KINDS] },
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListBranchRestrictionsCommand,
        options
      );
    });

  branchRestrictionCmd
    .command('view <id>')
    .description('View a branch restriction rule')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb branch-restriction view 12',
          "bb branch-restriction view 12 --json --jq '.branchRestriction.kind'",
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ViewBranchRestrictionCommand,
        { id, ...options }
      );
    });

  branchRestrictionCmd
    .command('create')
    .description('Create a branch restriction rule')
    .addOption(
      withCompletionChoices(
        new Option('--kind <kind>', 'Restriction kind (required)'),
        BRANCH_RESTRICTION_KINDS
      )
    )
    .option('--pattern <glob>', 'Branch glob pattern, e.g. main or release/*')
    .addOption(
      withCompletionChoices(
        new Option(
          '--branch-type <type>',
          'Branching-model branch type (instead of --pattern)'
        ),
        BRANCH_RESTRICTION_BRANCH_TYPES
      )
    )
    .option(
      '--value <number>',
      'Kind-specific count, e.g. minimum approvals or passing builds'
    )
    .option(
      '--user <user>',
      'Exempt a user by account ID or {uuid} (repeatable; push and restrict_merges only)',
      collectRepeated,
      [] as string[]
    )
    .option(
      '--group <slug>',
      'Exempt a workspace group by slug (repeatable; push and restrict_merges only)',
      collectRepeated,
      [] as string[]
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb branch-restriction create --kind force --pattern main',
          'bb branch-restriction create --kind require_approvals_to_merge --pattern main --value 2',
          'bb branch-restriction create --kind push --branch-type production --group release-managers',
          "bb branch-restriction create --kind delete --pattern 'release/*' --json --jq '.branchRestriction.id'",
        ],
        validValues: {
          'Valid kinds': [...BRANCH_RESTRICTION_KINDS],
          'Valid branch types': [...BRANCH_RESTRICTION_BRANCH_TYPES],
        },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.CreateBranchRestrictionCommand,
        options
      );
    });

  branchRestrictionCmd
    .command('delete <id>')
    .description('Delete a branch restriction rule')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb branch-restriction delete 12',
          'bb branch-restriction delete 12 --yes',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.DeleteBranchRestrictionCommand,
        { id, ...options }
      );
    });

  parent.addCommand(branchRestrictionCmd);
}
