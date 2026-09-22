import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import {
  collectRepeated,
  withCompletionChoices,
} from '../../core/command-options.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { PullrequestMergeParametersMergeStrategyEnum } from '../../generated/api.js';
import { PR_STATES } from '../../types/pr.js';
import { COLOR_WHENS } from './diff.command.js';
import { registerPrCommentsCommands } from './comments.register.js';
import { registerPrReviewersCommands } from './reviewers.register.js';

// Sourced from the generated OpenAPI enum so completion and the `validValues`
// help block track the spec on every `bun run generate:api`.
const MERGE_STRATEGIES = Object.values(
  PullrequestMergeParametersMergeStrategyEnum
);

export function registerPrCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const prCmd = new Command('pr').description('Manage pull requests');

  prCmd
    .command('create')
    .description('Create a pull request')
    .option('-t, --title <title>', 'Pull request title')
    .option('-b, --body <body>', 'Pull request description')
    .option('-s, --source <branch>', 'Source branch (default: current branch)')
    .option('-d, --destination <branch>', 'Destination branch (default: main)')
    .option('--close-source-branch', 'Close source branch after merge')
    .option('--draft', 'Create the pull request as draft')
    .option(
      '--reviewer <user>',
      'Add a reviewer by account ID or {uuid} (repeatable)',
      collectRepeated,
      [] as string[]
    )
    .option('--default-reviewers', "Include the repository's default reviewers")
    .option(
      '--no-default-reviewers',
      "Skip the repository's default reviewers even when prCreateIncludeDefaultReviewers is true"
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr create -t "My PR" -b "Description"',
          'bb pr create -t "My PR" --draft',
          'bb pr create -t "My PR" -s feature -d develop',
          'bb pr create -t "My PR" --close-source-branch',
          'bb pr create -t "My PR" --default-reviewers',
          'bb pr create -t "My PR" --reviewer jdoe --reviewer asmith',
        ],
        defaults: {
          source: 'current git branch',
          destination: 'main',
          'default-reviewers':
            'false (override with --default-reviewers or config key prCreateIncludeDefaultReviewers)',
        },
        seeAlso: [
          {
            label: 'Repository Context',
            url: 'https://bitbucket-cli.paulvanderlei.com/guides/repository-context/',
          },
          {
            label: 'Default reviewers',
            url: 'https://bitbucket-cli.paulvanderlei.com/commands/repo/#bb-repo-default-reviewers',
          },
        ],
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.CreatePRCommand,
        options
      );
    });

  prCmd
    .command('list')
    .description('List pull requests')
    .addOption(
      withCompletionChoices(
        new Option(
          '-s, --state <state>',
          `Filter by state (${PR_STATES.join(', ')})`
        ).default('OPEN'),
        PR_STATES
      )
    )
    .option('--limit <number>', 'Maximum number of PRs to list', '25')
    .option('--all', 'List all pull requests (overrides --limit)')
    .option(
      '--mine',
      'Show only PRs where you are a reviewer (not authored by you)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr list',
          'bb pr list -s MERGED --limit 10',
          'bb pr list --all',
          'bb pr list --mine',
          'bb pr list --json',
        ],
        validValues: {
          'Valid states': [...PR_STATES],
        },
        defaults: { state: 'OPEN', limit: '25' },
        seeAlso: [
          {
            label: 'Scripting & Automation',
            url: 'https://bitbucket-cli.paulvanderlei.com/guides/scripting/',
          },
          {
            label: 'JSON Output',
            url: 'https://bitbucket-cli.paulvanderlei.com/reference/json-output/',
          },
        ],
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListPRsCommand,
        options
      );
    });

  prCmd
    .command('view <id>')
    .description('View pull request details')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb pr view 42', 'bb pr view 42 --json'],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('activity <id>')
    .description('Show pull request activity log')
    .option('--limit <number>', 'Maximum number of activity entries', '25')
    .option('--all', 'Show all activity entries (overrides --limit)')
    // No `withCompletionChoices` here on purpose: `--type` is a comma-separated
    // multi-value filter, and flag-value completion can only offer a single value
    // for the token after the flag — it can't append to an in-progress list.
    .option('--type <types>', 'Filter activity by type (comma-separated)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr activity 42',
          'bb pr activity 42 --type comment,approval',
          'bb pr activity 42 --all',
          'bb pr activity 42 --limit 10 --json',
        ],
        validValues: {
          'Valid activity types (comma-separated)': [
            'comment',
            'approval',
            'changes_requested',
            'merge',
            'decline',
            'commit',
            'update',
          ],
        },
        defaults: { limit: '25' },
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ActivityPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('checks <id>')
    .description('Show CI/CD checks and build status for a pull request')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb pr checks 42', 'bb pr checks 42 --json'],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ChecksPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('edit [id]')
    .description('Edit a pull request')
    .option('-t, --title <title>', 'New pull request title')
    .option('-b, --body <body>', 'New pull request description')
    .option('-F, --body-file <file>', 'Read description from file')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr edit 42 -t "New title"',
          'bb pr edit 42 -b "Updated description"',
          'bb pr edit 42 -F description.md',
          'bb pr edit',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.EditPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('merge <id>')
    .description('Merge a pull request')
    .option('-m, --message <message>', 'Merge commit message')
    .option('--close-source-branch', 'Delete the source branch after merging')
    .addOption(
      withCompletionChoices(
        new Option('--strategy <strategy>', 'Merge strategy'),
        MERGE_STRATEGIES
      )
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr merge 42',
          'bb pr merge 42 --strategy squash --close-source-branch',
          'bb pr merge 42 -m "Merge feature X"',
        ],
        validValues: {
          'Valid merge strategies': [...MERGE_STRATEGIES],
        },
        defaults: {
          strategy:
            "the repository's configured merge strategy (typically merge_commit)",
        },
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.MergePRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('approve <id>')
    .description('Approve a pull request')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr approve 42',
          'bb pr approve 42 --json',
          'bb pr approve 42 -w my-workspace -r my-repo',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ApprovePRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('decline <id>')
    .description('Decline a pull request')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr decline 42',
          'bb pr decline 42 --json',
          'bb pr decline 42 -w my-workspace -r my-repo',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.DeclinePRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('ready <id>')
    .description('Mark a draft pull request as ready for review')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr ready 42',
          'bb pr ready 42 --json',
          'bb pr ready 42 -w my-workspace -r my-repo',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ReadyPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('checkout <id>')
    .description('Checkout a pull request locally')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr checkout 42',
          'bb pr checkout 42 -w my-workspace -r my-repo',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.CheckoutPRCommand, {
        id,
        ...options,
      });
    });

  prCmd
    .command('diff [id]')
    .description('View pull request diff')
    .addOption(
      withCompletionChoices(
        new Option('--color <when>', 'Colorize output').default('auto'),
        COLOR_WHENS
      )
    )
    .option('--name-only', 'Show only names of changed files')
    .option('--stat', 'Show diffstat')
    .option('--web', 'Open diff in web browser')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr diff 42',
          'bb pr diff 42 --stat',
          'bb pr diff 42 --name-only',
          'bb pr diff --web',
          'bb pr diff 42 --color always',
        ],
        validValues: {
          'Valid --color values': [...COLOR_WHENS],
        },
        defaults: { color: 'auto' },
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.DiffPRCommand, {
        id,
        ...options,
      });
    });

  registerPrCommentsCommands(prCmd, registrar);
  registerPrReviewersCommands(prCmd, registrar);

  parent.addCommand(prCmd);
}
