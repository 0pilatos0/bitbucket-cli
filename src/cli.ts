/**
 * CLI setup with Commander.js
 */

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { bootstrap } from './bootstrap.js';
import { createHelpTextBuilder } from './help-text.js';
import { ServiceTokens } from './core/container.js';
import type { ServiceToken } from './core/container.js';
import type { BaseCommand } from './core/base-command.js';
import type { CommandContext } from './core/interfaces/commands.js';
import type { IOutputService } from './core/interfaces/services.js';
import type { VersionService } from './services/version.service.js';
import { PR_STATES } from './types/pr.js';
import { BBError, ErrorCode } from './types/errors.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

import tabtab from 'tabtab';

/**
 * Walk a tokenized completion line to find the nearest non-flag token
 * preceding `word`. Used to disambiguate nested subcommands that share a
 * name (e.g. `bb pr comments` vs `bb snippet comments`) without resorting
 * to fragile substring matching on the raw line.
 */
export function getCompletionParent(
  line: string | undefined,
  word: string
): string | undefined {
  if (typeof line !== 'string') {
    return undefined;
  }
  const tokens = line.split(/\s+/).filter(Boolean);
  const idx = tokens.lastIndexOf(word);
  if (idx <= 0) {
    return undefined;
  }
  for (let i = idx - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token && !token.startsWith('-')) {
      return token;
    }
  }
  return undefined;
}

/**
 * Subcommands keyed by their direct parent. `comments` is handled
 * specially because it appears under both `pr` and `snippet`.
 */
const ROOT_COMPLETIONS: readonly string[] = [
  'auth',
  'repo',
  'pr',
  'snippet',
  'config',
  'completion',
  '--help',
  '--version',
  '--json',
  '--no-color',
  '--workspace',
  '--repo',
];

const SUBCOMMAND_COMPLETIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ['auth', ['login', 'logout', 'status', 'token']],
  ['repo', ['clone', 'create', 'list', 'view', 'delete', 'default-reviewers']],
  ['default-reviewers', ['list', 'add', 'remove']],
  [
    'pr',
    [
      'create',
      'list',
      'view',
      'activity',
      'checks',
      'edit',
      'merge',
      'approve',
      'decline',
      'ready',
      'checkout',
      'diff',
      'comments',
      'reviewers',
    ],
  ],
  ['reviewers', ['list', 'add', 'remove']],
  [
    'snippet',
    [
      'list',
      'view',
      'create',
      'edit',
      'delete',
      'watch',
      'unwatch',
      'comments',
    ],
  ],
  ['config', ['get', 'set', 'list']],
  ['completion', ['install', 'uninstall']],
]);

const COMMENTS_SUBCOMMANDS: readonly string[] = [
  'list',
  'add',
  'edit',
  'delete',
];

// Handle tabtab completion
if (process.argv.includes('--get-yargs-completions') || process.env.COMP_LINE) {
  const env = tabtab.parseEnv(process.env);
  if (env.complete) {
    const completions = [...ROOT_COMPLETIONS];

    if (env.prev === 'comments') {
      const parent = getCompletionParent(env.line, 'comments');
      if (parent === 'snippet' || parent === 'pr') {
        completions.push(...COMMENTS_SUBCOMMANDS);
      }
    } else {
      const subcommands = SUBCOMMAND_COMPLETIONS.get(env.prev);
      if (subcommands) {
        completions.push(...subcommands);
      }
    }

    tabtab.log(completions);
    process.exit(0);
  }
}

export function resolveNoColorSetting(
  argv: string[],
  env: NodeJS.ProcessEnv
): boolean {
  const hasColorArg = argv.includes('--color');
  const hasNoColorArg = argv.includes('--no-color');
  const hasForceColorEnv =
    env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '0';
  const hasNoColorEnv = env.NO_COLOR !== undefined;

  if (hasColorArg) {
    return false;
  }

  if (hasForceColorEnv) {
    return false;
  }

  if (hasNoColorArg) {
    return true;
  }

  return hasNoColorEnv;
}

// Bootstrap the container
const noColor = resolveNoColorSetting(process.argv, process.env);
const buildHelpText = createHelpTextBuilder(noColor);

const container = bootstrap({ noColor });

// Helper to create command context. Validation errors from --json/--jq
// parsing are deferred onto `context.validationError` so they can be raised
// inside BaseCommand.run() and rendered through the normal error path,
// instead of escaping a Commander action handler as an unhandled rejection.
function createContext(program: Command): CommandContext {
  const opts = program.opts();
  const jsonOpt = opts.json as string | boolean | undefined;
  const jqOpt = opts.jq as string | undefined;

  const json = jsonOpt !== undefined && jsonOpt !== false;
  let jsonFields: string[] | undefined;
  let validationError: BBError | undefined;

  if (typeof jsonOpt === 'string') {
    const fields = jsonOpt
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    if (fields.length === 0) {
      validationError = new BBError({
        code: ErrorCode.JSON_FORMAT_INVALID,
        message: '--json field list cannot be empty',
      });
    } else {
      jsonFields = fields;
    }
  }

  if (!validationError && jqOpt !== undefined && !json) {
    validationError = new BBError({
      code: ErrorCode.JSON_FORMAT_INVALID,
      message: '--jq requires --json',
    });
  }

  return {
    globalOptions: {
      json: json || undefined,
      jsonFields,
      jq: jqOpt,
      noColor: opts.color === false,
      workspace: opts.workspace,
      repo: opts.repo,
    },
    validationError,
  };
}

async function runCommand<TOptions, TResult>(
  token: ServiceToken,
  options: TOptions,
  program: Command,
  context?: CommandContext
): Promise<TResult | undefined> {
  try {
    const cmd = container.resolve<BaseCommand<TOptions, TResult>>(token);
    const resolvedContext = context ?? createContext(program);

    return await cmd.run(options, resolvedContext);
  } catch (error) {
    // BaseCommand.run() already calls handleError() which outputs the error
    // and sets process.exitCode before re-throwing. We only need to handle
    // errors that occur outside of run() (e.g., container resolution failures).
    if (
      error instanceof Error &&
      error.message.startsWith('Service not registered')
    ) {
      console.error(`Internal error: ${error.message}`);
    }

    if (!process.exitCode) {
      process.exitCode = 1;
    }

    return undefined;
  }
}

// Helper to merge global options with local options
export function withGlobalOptions<T extends Record<string, unknown>>(
  options: T,
  context: CommandContext
): T & { workspace?: string; repo?: string } {
  return {
    ...options,
    workspace:
      (options.workspace as string | undefined) ??
      context.globalOptions.workspace,
    repo: (options.repo as string | undefined) ?? context.globalOptions.repo,
  } as T & { workspace?: string; repo?: string };
}

// Create CLI
export const cli = new Command();

cli
  .name('bb')
  .description('A command-line interface for Bitbucket Cloud')
  .version(pkg.version)
  .option(
    '--json [fields]',
    'Output as JSON; optionally project to a comma-separated field list (e.g. number,title,author.display_name)'
  )
  .option(
    '--jq <expression>',
    'Filter the JSON output through a jq expression (requires --json)'
  )
  .option('--no-color', 'Disable color output')
  .option('-w, --workspace <workspace>', 'Specify workspace')
  .option('-r, --repo <repo>', 'Specify repository')
  .addHelpText(
    'after',
    buildHelpText({
      envVars: {
        BB_USERNAME: 'Bitbucket username (fallback for auth login)',
        BB_API_TOKEN: 'Bitbucket API token (fallback for auth login)',
        NO_COLOR: 'Disable color output when set',
        FORCE_COLOR: "Force color output when set (and not '0')",
        DEBUG: "Enable HTTP debug logging when 'true'",
      },
      seeAlso: [
        {
          label: 'Quick Start',
          url: 'https://bitbucket-cli.paulvanderlei.com/getting-started/quickstart/',
        },
        {
          label: 'Scripting',
          url: 'https://bitbucket-cli.paulvanderlei.com/guides/scripting/',
        },
        {
          label: 'Changelog',
          url: 'https://bitbucket-cli.paulvanderlei.com/help/changelog/',
        },
      ],
    })
  )
  .action(async () => {
    // Show help when no subcommand is provided
    cli.outputHelp();

    // Check for updates after showing help
    const versionService = container.resolve<VersionService>(
      ServiceTokens.VersionService
    );
    const output = container.resolve<IOutputService>(
      ServiceTokens.OutputService
    );

    try {
      const result = await versionService.checkForUpdate();
      if (result?.updateAvailable) {
        output.text('');
        output.text('─'.repeat(50));
        output.text(
          `⚠ A new version is available: ${result.latestVersion} (you have ${result.currentVersion})`
        );
        output.text(`  Run '${versionService.getInstallCommand()}' to update`);
        output.text(`  Or disable with 'bb config set skipVersionCheck true'`);
        output.text('─'.repeat(50));
      }
    } catch {
      // Silently ignore version check errors
    }
  });

// Auth commands
const authCmd = new Command('auth').description('Authenticate with Bitbucket');

authCmd
  .command('login')
  .description('Authenticate with Bitbucket (OAuth or API token)')
  .option(
    '-u, --username <username>',
    'Bitbucket username (implies API token auth)'
  )
  .option(
    '-p, --password <password>',
    'Bitbucket API token (implies API token auth)'
  )
  .option('--app-password', 'Use API token authentication instead of OAuth')
  .option('--client-id <clientId>', 'Custom OAuth consumer client ID')
  .option(
    '--client-secret <clientSecret>',
    'Custom OAuth consumer client secret'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb auth login',
        'bb auth login --app-password -u myuser -p mytoken',
        'bb auth login --client-id <id>',
        'BB_USERNAME=myuser BB_API_TOKEN=mytoken bb auth login',
      ],
      envVars: {
        BB_USERNAME: 'Used when --username is not provided',
        BB_API_TOKEN:
          'Used when --password is not provided (implies API token auth)',
      },
    })
  )
  .action(async (options) => {
    await runCommand(ServiceTokens.LoginCommand, options, cli);
  });

authCmd
  .command('logout')
  .description('Log out of Bitbucket')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb auth logout', 'bb auth logout --json'],
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.LogoutCommand, undefined, cli);
  });

authCmd
  .command('status')
  .description('Show authentication status')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb auth status', 'bb auth status --json'],
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.StatusCommand, undefined, cli);
  });

authCmd
  .command('token')
  .description('Print the current access token')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb auth token', 'bb auth token | pbcopy'],
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.TokenCommand, undefined, cli);
  });

cli.addCommand(authCmd);

// Repo commands
const repoCmd = new Command('repo').description('Manage repositories');

repoCmd
  .command('clone <repository>')
  .description('Clone a Bitbucket repository')
  .option('-d, --directory <dir>', 'Directory to clone into')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo clone workspace/repo-name',
        'bb repo clone workspace/repo-name -d my-directory',
      ],
    })
  )
  .action(async (repository, options) => {
    await runCommand(
      ServiceTokens.CloneCommand,
      { repository, ...options },
      cli
    );
  });

repoCmd
  .command('create <name>')
  .description('Create a new repository')
  .option('-d, --description <description>', 'Repository description')
  .option('--private', 'Create a private repository (default)')
  .option('--public', 'Create a public repository')
  .option('-p, --project <project>', 'Project key')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo create my-repo',
        'bb repo create my-repo --public -p PROJ',
        'bb repo create my-repo -d "My new repository"',
      ],
      defaults: { private: 'true (visibility is private unless --public)' },
    })
  )
  .action(async (name, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CreateRepoCommand,
      withGlobalOptions({ name, ...options }, context),
      cli,
      context
    );
  });

repoCmd
  .command('list')
  .description('List repositories')
  .option('--limit <number>', 'Maximum number of repositories to list', '25')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo list',
        'bb repo list --limit 50',
        'bb repo list --json',
      ],
      defaults: { limit: '25' },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListReposCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

repoCmd
  .command('view [repository]')
  .description('View repository details')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo view',
        'bb repo view workspace/repo-name',
        'bb repo view workspace/repo-name --json',
      ],
    })
  )
  .action(async (repository, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewRepoCommand,
      withGlobalOptions({ repository, ...options }, context),
      cli,
      context
    );
  });

repoCmd
  .command('delete <repository>')
  .description('Delete a repository')
  .option('-y, --yes', 'Skip confirmation prompt')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo delete workspace/repo-name',
        'bb repo delete workspace/repo-name --yes',
      ],
    })
  )
  .action(async (repository, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteRepoCommand,
      withGlobalOptions({ repository, ...options }, context),
      cli,
      context
    );
  });

const repoDefaultReviewersCmd = new Command('default-reviewers').description(
  'Manage default reviewers for a repository'
);

repoDefaultReviewersCmd
  .command('list')
  .description('List default reviewers for a repository')
  .option(
    '--repo-only',
    'Only show reviewers configured on the repository (exclude project-inherited)'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo default-reviewers list',
        'bb repo default-reviewers list --repo-only',
        'bb repo default-reviewers list --json',
      ],
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListDefaultReviewersCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

repoDefaultReviewersCmd
  .command('add <user>')
  .description(
    'Add a default reviewer to a repository (accepts account ID or {uuid})'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo default-reviewers add "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
        'bb repo default-reviewers add "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
      ],
    })
  )
  .action(async (username, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.AddDefaultReviewerCommand,
      withGlobalOptions({ username, ...options }, context),
      cli,
      context
    );
  });

repoDefaultReviewersCmd
  .command('remove <user>')
  .description(
    'Remove a default reviewer from a repository (accepts account ID or {uuid})'
  )
  .option('-y, --yes', 'Skip confirmation prompt')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo default-reviewers remove "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f" --yes',
      ],
    })
  )
  .action(async (username, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.RemoveDefaultReviewerCommand,
      withGlobalOptions({ username, ...options }, context),
      cli,
      context
    );
  });

repoCmd.addCommand(repoDefaultReviewersCmd);

cli.addCommand(repoCmd);

// PR commands
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
    (value: string, previous: string[]) => previous.concat([value]),
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CreatePRCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

prCmd
  .command('list')
  .description('List pull requests')
  .option(
    '-s, --state <state>',
    `Filter by state (${PR_STATES.join(', ')})`,
    'OPEN'
  )
  .option('--limit <number>', 'Maximum number of PRs to list', '25')
  .option('--mine', 'Show only PRs where you are a reviewer')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr list',
        'bb pr list -s MERGED --limit 10',
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListPRsCommand,
      withGlobalOptions(options, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

prCmd
  .command('activity <id>')
  .description('Show pull request activity log')
  .option('--limit <number>', 'Maximum number of activity entries', '25')
  .option('--type <types>', 'Filter activity by type (comma-separated)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr activity 42',
        'bb pr activity 42 --type comment,approval',
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ActivityPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ChecksPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.EditPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

prCmd
  .command('merge <id>')
  .description('Merge a pull request')
  .option('-m, --message <message>', 'Merge commit message')
  .option('--close-source-branch', 'Delete the source branch after merging')
  .option('--strategy <strategy>', 'Merge strategy')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr merge 42',
        'bb pr merge 42 --strategy squash --close-source-branch',
        'bb pr merge 42 -m "Merge feature X"',
      ],
      validValues: {
        'Valid merge strategies': [
          'merge_commit',
          'squash',
          'fast_forward',
          'squash_fast_forward',
          'rebase_fast_forward',
          'rebase_merge',
        ],
      },
      defaults: {
        strategy:
          "the repository's configured merge strategy (typically merge_commit)",
      },
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.MergePRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ApprovePRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeclinePRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ReadyPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CheckoutPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

prCmd
  .command('diff [id]')
  .description('View pull request diff')
  .option('--color <when>', 'Colorize output', 'auto')
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
        'Valid --color values': ['auto', 'always', 'never'],
      },
      defaults: { color: 'auto' },
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DiffPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

const prCommentsCmd = new Command('comments').description(
  'Manage pull request comments'
);

prCommentsCmd
  .command('list <id>')
  .description('List comments on a pull request')
  .option('--limit <number>', 'Maximum number of comments (default: 25)')
  .option('--no-truncate', 'Show full comment content without truncation')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments list 42',
        'bb pr comments list 42 --no-truncate',
        'bb pr comments list 42 --limit 50 --json',
      ],
      defaults: { limit: '25' },
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListCommentsPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('add <id> <message>')
  .description('Add a comment to a pull request')
  .option('--file <path>', 'File path in the diff for inline comment')
  .option('--line-to <number>', 'Line number in the new file version')
  .option('--line-from <number>', 'Line number in the old file version')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments add 42 "LGTM"',
        'bb pr comments add 42 "Fix this" --file src/main.ts --line-to 10',
      ],
    })
  )
  .action(async (id, message, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CommentPRCommand,
      withGlobalOptions({ id, message, ...options }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('edit <pr-id> <comment-id> <message>')
  .description('Edit a comment on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments edit 42 12345 "Updated comment"',
        'bb pr comments edit 42 12345 "Updated comment" --json',
      ],
    })
  )
  .action(async (prId, commentId, message, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.EditCommentPRCommand,
      withGlobalOptions({ prId, commentId, message }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('delete <pr-id> <comment-id>')
  .description('Delete a comment on a pull request')
  .option('-y, --yes', 'Skip confirmation prompt')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments delete 42 12345',
        'bb pr comments delete 42 12345 --yes',
      ],
    })
  )
  .action(async (prId, commentId, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteCommentPRCommand,
      withGlobalOptions({ prId, commentId, ...options }, context),
      cli,
      context
    );
  });

const prReviewersCmd = new Command('reviewers').description(
  'Manage pull request reviewers'
);

prReviewersCmd
  .command('list <id>')
  .description('List reviewers on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb pr reviewers list 42', 'bb pr reviewers list 42 --json'],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListReviewersPRCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

prReviewersCmd
  .command('add <id> <username>')
  .description('Add a reviewer to a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr reviewers add 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
        'bb pr reviewers add 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
      ],
    })
  )
  .action(async (id, username, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.AddReviewerPRCommand,
      withGlobalOptions({ id, username, ...options }, context),
      cli,
      context
    );
  });

prReviewersCmd
  .command('remove <id> <username>')
  .description('Remove a reviewer from a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr reviewers remove 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
        'bb pr reviewers remove 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
      ],
    })
  )
  .action(async (id, username, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.RemoveReviewerPRCommand,
      withGlobalOptions({ id, username, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(prCmd);
prCmd.addCommand(prCommentsCmd);
prCmd.addCommand(prReviewersCmd);

// Snippet commands
const snippetCmd = new Command('snippet').description('Manage snippets');

snippetCmd
  .command('list')
  .description('List snippets in a workspace')
  .option('--role <role>', 'Filter by role (owner, contributor, member)')
  .option('--limit <number>', 'Maximum number of snippets to list', '25')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet list',
        'bb snippet list --role owner',
        'bb snippet list --limit 50 --json',
      ],
      validValues: {
        'Valid roles': ['owner', 'contributor', 'member'],
      },
      defaults: { limit: '25' },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListSnippetsCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

snippetCmd
  .command('view <id>')
  .description('View snippet details')
  .option(
    '-f, --file <name>',
    'Print contents of a specific file in the snippet'
  )
  .option('--files', 'Print contents of all files in the snippet')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet view kypj',
        'bb snippet view kypj --json',
        'bb snippet view kypj --file foo.txt',
        'bb snippet view kypj --files',
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewSnippetCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

snippetCmd
  .command('create')
  .description('Create a new snippet')
  .option('-t, --title <title>', 'Snippet title')
  .option('-f, --file <path...>', 'File(s) to include')
  .option('--private', 'Create a private snippet (default)')
  .option('--public', 'Create a public snippet')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet create -t "My snippet" -f file.txt',
        'bb snippet create -t "Config files" -f config.yml -f setup.sh --public',
      ],
      defaults: { private: 'true (visibility is private unless --public)' },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CreateSnippetCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

snippetCmd
  .command('edit <id>')
  .description('Edit a snippet')
  .option('-t, --title <title>', 'New snippet title')
  .option('--private', 'Make snippet private')
  .option('--public', 'Make snippet public')
  .option(
    '-f, --file <path...>',
    'Replace/add file(s) (sends multipart update)'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet edit kypj -t "New title"',
        'bb snippet edit kypj --public',
        'bb snippet edit kypj -f updated.txt',
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.EditSnippetCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

snippetCmd
  .command('delete <id>')
  .description('Delete a snippet')
  .option('-y, --yes', 'Skip confirmation prompt')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb snippet delete kypj', 'bb snippet delete kypj --yes'],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteSnippetCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

snippetCmd
  .command('watch <id>')
  .description('Watch a snippet')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb snippet watch kypj', 'bb snippet watch kypj -w my-team'],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.WatchSnippetCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

snippetCmd
  .command('unwatch <id>')
  .description('Stop watching a snippet')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet unwatch kypj',
        'bb snippet unwatch kypj -w my-team',
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.UnwatchSnippetCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

const snippetCommentsCmd = new Command('comments').description(
  'Manage snippet comments'
);

snippetCommentsCmd
  .command('list <id>')
  .description('List comments on a snippet')
  .option('--limit <number>', 'Maximum number of comments', '25')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet comments list kypj',
        'bb snippet comments list kypj --limit 50 --json',
      ],
      defaults: { limit: '25' },
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListSnippetCommentsCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

snippetCommentsCmd
  .command('add <id> [message]')
  .description('Add a comment to a snippet (message is required)')
  .option(
    '-m, --message <text>',
    'Comment message (alternative to the positional [message] argument; one of the two is required)'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet comments add kypj "Great snippet!"',
        'bb snippet comments add kypj -m "Great snippet!"',
        'bb snippet comments add kypj "Great snippet!" --json',
      ],
    })
  )
  .action(async (id, message, options) => {
    const context = createContext(cli);
    const resolvedMessage = message ?? options.message;
    await runCommand(
      ServiceTokens.AddSnippetCommentCommand,
      withGlobalOptions({ id, ...options, message: resolvedMessage }, context),
      cli,
      context
    );
  });

snippetCommentsCmd
  .command('edit <snippet-id> <comment-id> <message>')
  .description('Edit a comment on a snippet')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet comments edit kypj 123 "Updated comment"',
        'bb snippet comments edit kypj 123 "Updated comment" --json',
      ],
    })
  )
  .action(async (snippetId, commentId, message, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.EditSnippetCommentCommand,
      withGlobalOptions({ snippetId, commentId, message }, context),
      cli,
      context
    );
  });

snippetCommentsCmd
  .command('delete <snippet-id> <comment-id>')
  .description('Delete a comment on a snippet')
  .option('-y, --yes', 'Skip confirmation prompt')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet comments delete kypj 123',
        'bb snippet comments delete kypj 123 --yes',
      ],
    })
  )
  .action(async (snippetId, commentId, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteSnippetCommentCommand,
      withGlobalOptions({ snippetId, commentId, ...options }, context),
      cli,
      context
    );
  });

snippetCmd.addCommand(snippetCommentsCmd);
cli.addCommand(snippetCmd);

// Config commands
const configCmd = new Command('config').description('Manage configuration');

configCmd
  .command('get <key>')
  .description('Get a configuration value')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb config get defaultWorkspace'],
      validValues: {
        'Readable config keys': [
          'username',
          'defaultWorkspace',
          'skipVersionCheck',
          'versionCheckInterval',
          'prCreateIncludeDefaultReviewers',
        ],
      },
    })
  )
  .action(async (key) => {
    await runCommand(ServiceTokens.GetConfigCommand, { key }, cli);
  });

configCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb config set defaultWorkspace my-workspace',
        'bb config set skipVersionCheck true',
        'bb config set versionCheckInterval 86400',
      ],
      validValues: {
        'Settable config keys': [
          'defaultWorkspace (string)',
          'skipVersionCheck (true/false)',
          'versionCheckInterval (positive integer, seconds)',
          'prCreateIncludeDefaultReviewers (true/false)',
        ],
      },
      seeAlso: [
        {
          label: 'Configuration File',
          url: 'https://bitbucket-cli.paulvanderlei.com/reference/configuration/',
        },
      ],
    })
  )
  .action(async (key, value) => {
    await runCommand(ServiceTokens.SetConfigCommand, { key, value }, cli);
  });

configCmd
  .command('list')
  .description('List all configuration values')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb config list', 'bb config list --json'],
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.ListConfigCommand, undefined, cli);
  });

cli.addCommand(configCmd);

// Completion commands
const completionCmd = new Command('completion').description(
  'Shell completion utilities'
);

completionCmd
  .command('install')
  .description('Install shell completions for bash, zsh, or fish')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb completion install', 'bb completion install --json'],
      validValues: {
        'Supported shells': ['bash', 'zsh', 'fish'],
      },
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.InstallCompletionCommand, undefined, cli);
  });

completionCmd
  .command('uninstall')
  .description('Uninstall shell completions')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb completion uninstall', 'bb completion uninstall --json'],
      validValues: {
        'Supported shells': ['bash', 'zsh', 'fish'],
      },
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.UninstallCompletionCommand, undefined, cli);
  });

cli.addCommand(completionCmd);
