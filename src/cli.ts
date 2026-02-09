/**
 * CLI setup with Commander.js
 */

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { bootstrap } from './bootstrap.js';
import { ServiceTokens } from './core/container.js';
import type { ServiceToken } from './core/container.js';
import type { BaseCommand } from './core/base-command.js';
import type { CommandContext } from './core/interfaces/commands.js';
import type { IOutputService } from './core/interfaces/services.js';
import type { VersionService } from './services/version.service.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

import tabtab from 'tabtab';

// Handle tabtab completion
if (process.argv.includes('--get-yargs-completions') || process.env.COMP_LINE) {
  const env = tabtab.parseEnv(process.env);
  if (env.complete) {
    const completions = [
      'auth',
      'repo',
      'pr',
      'config',
      'completion',
      '--help',
      '--version',
      '--json',
      '--no-color',
      '--workspace',
      '--repo',
    ];

    // Add subcommands based on current command
    if (env.prev === 'auth') {
      completions.push('login', 'logout', 'status', 'token');
    } else if (env.prev === 'repo') {
      completions.push('clone', 'create', 'list', 'view', 'delete');
    } else if (env.prev === 'pr') {
      completions.push(
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
        'reviewers'
      );
    } else if (env.prev === 'reviewers') {
      completions.push('list', 'add', 'remove');
    } else if (env.prev === 'config') {
      completions.push('get', 'set', 'list');
    } else if (env.prev === 'completion') {
      completions.push('install', 'uninstall');
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

const container = bootstrap({ noColor });

// Helper to create command context
function createContext(program: Command): CommandContext {
  const opts = program.opts();
  return {
    globalOptions: {
      json: opts.json,
      noColor: opts.color === false,
      workspace: opts.workspace,
      repo: opts.repo,
    },
  };
}

async function runCommand<TOptions, TResult>(
  token: ServiceToken,
  options: TOptions,
  program: Command,
  context?: CommandContext
): Promise<TResult | undefined> {
  const cmd = container.resolve<BaseCommand<TOptions, TResult>>(token);
  const resolvedContext = context ?? createContext(program);

  try {
    return await cmd.run(options, resolvedContext);
  } catch {
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
  .option('--json', 'Output as JSON')
  .option('--no-color', 'Disable color output')
  .option('-w, --workspace <workspace>', 'Specify workspace')
  .option('-r, --repo <repo>', 'Specify repository')
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
  .description('Authenticate with Bitbucket using an API token')
  .option('-u, --username <username>', 'Bitbucket username')
  .option('-p, --password <password>', 'Bitbucket API token')
  .action(async (options) => {
    await runCommand(ServiceTokens.LoginCommand, options, cli);
  });

authCmd
  .command('logout')
  .description('Log out of Bitbucket')
  .action(async () => {
    await runCommand(ServiceTokens.LogoutCommand, undefined, cli);
  });

authCmd
  .command('status')
  .description('Show authentication status')
  .action(async () => {
    await runCommand(ServiceTokens.StatusCommand, undefined, cli);
  });

authCmd
  .command('token')
  .description('Print the current access token')
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
  .action(async (repository, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteRepoCommand,
      withGlobalOptions({ repository, ...options }, context),
      cli,
      context
    );
  });

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
    'Filter by state (OPEN, MERGED, DECLINED, SUPERSEDED)',
    'OPEN'
  )
  .option('--limit <number>', 'Maximum number of PRs to list', '25')
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
  .option('--json', 'Output as JSON')
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
  .option(
    '--strategy <strategy>',
    'Merge strategy (merge_commit, squash, fast_forward)'
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
  .option('--color <when>', 'Colorize output (auto, always, never)', 'auto')
  .option('--name-only', 'Show only names of changed files')
  .option('--stat', 'Show diffstat')
  .option('--web', 'Open diff in web browser')
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
  .action(async (prId, commentId, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.DeleteCommentPRCommand,
      withGlobalOptions({ prId, commentId }, context),
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

// Config commands
const configCmd = new Command('config').description('Manage configuration');

configCmd
  .command('get <key>')
  .description('Get a configuration value')
  .action(async (key) => {
    await runCommand(ServiceTokens.GetConfigCommand, { key }, cli);
  });

configCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    await runCommand(ServiceTokens.SetConfigCommand, { key, value }, cli);
  });

configCmd
  .command('list')
  .description('List all configuration values')
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
  .action(async () => {
    await runCommand(ServiceTokens.InstallCompletionCommand, undefined, cli);
  });

completionCmd
  .command('uninstall')
  .description('Uninstall shell completions')
  .action(async () => {
    await runCommand(ServiceTokens.UninstallCompletionCommand, undefined, cli);
  });

cli.addCommand(completionCmd);
