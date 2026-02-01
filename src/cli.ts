/**
 * CLI setup with Commander.js
 */

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { bootstrap } from './bootstrap.js';
import { ServiceTokens } from './core/container.js';
import type { CommandContext } from './core/interfaces/commands.js';
import type { VersionService } from './services/version.service.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// Command types
import type { LoginCommand } from './commands/auth/login.command.js';
import type { LogoutCommand } from './commands/auth/logout.command.js';
import type { StatusCommand } from './commands/auth/status.command.js';
import type { TokenCommand } from './commands/auth/token.command.js';
import type { CloneCommand } from './commands/repo/clone.command.js';
import type { CreateRepoCommand } from './commands/repo/create.command.js';
import type { ListReposCommand } from './commands/repo/list.command.js';
import type { ViewRepoCommand } from './commands/repo/view.command.js';
import type { DeleteRepoCommand } from './commands/repo/delete.command.js';
import type { CreatePRCommand } from './commands/pr/create.command.js';
import type { ListPRsCommand } from './commands/pr/list.command.js';
import type { ViewPRCommand } from './commands/pr/view.command.js';
import type { EditPRCommand } from './commands/pr/edit.command.js';
import type { MergePRCommand } from './commands/pr/merge.command.js';
import type { ApprovePRCommand } from './commands/pr/approve.command.js';
import type { DeclinePRCommand } from './commands/pr/decline.command.js';
import type { ReadyPRCommand } from './commands/pr/ready.command.js';
import type { CheckoutPRCommand } from './commands/pr/checkout.command.js';
import type { DiffPRCommand } from './commands/pr/diff.command.js';
import type { ActivityPRCommand } from './commands/pr/activity.command.js';
import type { ChecksPRCommand } from './commands/pr/checks.command.js';
import type { CommentPRCommand } from './commands/pr/comment.command.js';
import type { ListCommentsPRCommand } from './commands/pr/comments.list.command.js';
import type { EditCommentPRCommand } from './commands/pr/comments.edit.command.js';
import type { DeleteCommentPRCommand } from './commands/pr/comments.delete.command.js';
import type { AddReviewerPRCommand } from './commands/pr/reviewers.add.command.js';
import type { RemoveReviewerPRCommand } from './commands/pr/reviewers.remove.command.js';
import type { ListReviewersPRCommand } from './commands/pr/reviewers.list.command.js';
import type { GetConfigCommand } from './commands/config/get.command.js';
import type { SetConfigCommand } from './commands/config/set.command.js';
import type { ListConfigCommand } from './commands/config/list.command.js';
import type { InstallCompletionCommand } from './commands/completion/install.command.js';
import type { UninstallCompletionCommand } from './commands/completion/uninstall.command.js';
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

// Bootstrap the container
const container = bootstrap();

// Helper to create command context
function createContext(program: Command): CommandContext {
  const opts = program.opts();
  return {
    globalOptions: {
      json: opts.json,
      workspace: opts.workspace,
      repo: opts.repo,
    },
  };
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
  .option('-w, --workspace <workspace>', 'Specify workspace')
  .option('-r, --repo <repo>', 'Specify repository')
  .action(async () => {
    // Show help when no subcommand is provided
    cli.outputHelp();

    // Check for updates after showing help
    const versionService = container.resolve<VersionService>(
      ServiceTokens.VersionService
    );

    try {
      const result = await versionService.checkForUpdate();
      if (result?.updateAvailable) {
        console.log('');
        console.log('─'.repeat(50));
        console.log(
          `⚠ A new version is available: ${result.latestVersion} (you have ${result.currentVersion})`
        );
        console.log(`  Run '${versionService.getInstallCommand()}' to update`);
        console.log(`  Or disable with 'bb config set skipVersionCheck true'`);
        console.log('─'.repeat(50));
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
    try {
      const cmd = container.resolve<LoginCommand>(ServiceTokens.LoginCommand);
      await cmd.execute(options, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

authCmd
  .command('logout')
  .description('Log out of Bitbucket')
  .action(async () => {
    try {
      const cmd = container.resolve<LogoutCommand>(ServiceTokens.LogoutCommand);
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

authCmd
  .command('status')
  .description('Show authentication status')
  .action(async () => {
    try {
      const cmd = container.resolve<StatusCommand>(ServiceTokens.StatusCommand);
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

authCmd
  .command('token')
  .description('Print the current access token')
  .action(async () => {
    try {
      const cmd = container.resolve<TokenCommand>(ServiceTokens.TokenCommand);
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

cli.addCommand(authCmd);

// Repo commands
const repoCmd = new Command('repo').description('Manage repositories');

repoCmd
  .command('clone <repository>')
  .description('Clone a Bitbucket repository')
  .option('-d, --directory <dir>', 'Directory to clone into')
  .action(async (repository, options) => {
    try {
      const cmd = container.resolve<CloneCommand>(ServiceTokens.CloneCommand);
      await cmd.execute({ repository, ...options }, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

repoCmd
  .command('create <name>')
  .description('Create a new repository')
  .option('-d, --description <description>', 'Repository description')
  .option('--private', 'Create a private repository (default)')
  .option('--public', 'Create a public repository')
  .option('-p, --project <project>', 'Project key')
  .action(async (name, options) => {
    try {
      const cmd = container.resolve<CreateRepoCommand>(
        ServiceTokens.CreateRepoCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ name, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

repoCmd
  .command('list')
  .description('List repositories')
  .option('--limit <number>', 'Maximum number of repositories to list', '25')
  .action(async (options) => {
    try {
      const cmd = container.resolve<ListReposCommand>(
        ServiceTokens.ListReposCommand
      );
      const context = createContext(cli);
      await cmd.execute(withGlobalOptions(options, context), context);
    } catch {
      process.exit(1);
    }
  });

repoCmd
  .command('view [repository]')
  .description('View repository details')
  .action(async (repository, options) => {
    try {
      const cmd = container.resolve<ViewRepoCommand>(
        ServiceTokens.ViewRepoCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ repository, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

repoCmd
  .command('delete <repository>')
  .description('Delete a repository')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (repository, options) => {
    try {
      const cmd = container.resolve<DeleteRepoCommand>(
        ServiceTokens.DeleteRepoCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ repository, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
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
    try {
      const cmd = container.resolve<CreatePRCommand>(
        ServiceTokens.CreatePRCommand
      );
      const context = createContext(cli);
      await cmd.execute(withGlobalOptions(options, context), context);
    } catch {
      process.exit(1);
    }
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
  .option('--mine', 'Show only PRs where you are a reviewer')
  .action(async (options) => {
    try {
      const cmd = container.resolve<ListPRsCommand>(
        ServiceTokens.ListPRsCommand
      );
      const context = createContext(cli);
      await cmd.execute(withGlobalOptions(options, context), context);
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('view <id>')
  .description('View pull request details')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ViewPRCommand>(ServiceTokens.ViewPRCommand);
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('activity <id>')
  .description('Show pull request activity log')
  .option('--limit <number>', 'Maximum number of activity entries', '25')
  .option('--type <types>', 'Filter activity by type (comma-separated)')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ActivityPRCommand>(
        ServiceTokens.ActivityPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('checks <id>')
  .description('Show CI/CD checks and build status for a pull request')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ChecksPRCommand>(
        ServiceTokens.ChecksPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('edit [id]')
  .description('Edit a pull request')
  .option('-t, --title <title>', 'New pull request title')
  .option('-b, --body <body>', 'New pull request description')
  .option('-F, --body-file <file>', 'Read description from file')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<EditPRCommand>(ServiceTokens.EditPRCommand);
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
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
    try {
      const cmd = container.resolve<MergePRCommand>(
        ServiceTokens.MergePRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('approve <id>')
  .description('Approve a pull request')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ApprovePRCommand>(
        ServiceTokens.ApprovePRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('decline <id>')
  .description('Decline a pull request')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<DeclinePRCommand>(
        ServiceTokens.DeclinePRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('ready <id>')
  .description('Mark a draft pull request as ready for review')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ReadyPRCommand>(
        ServiceTokens.ReadyPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('checkout <id>')
  .description('Checkout a pull request locally')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<CheckoutPRCommand>(
        ServiceTokens.CheckoutPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCmd
  .command('diff [id]')
  .description('View pull request diff')
  .option('--color <when>', 'Colorize output (auto, always, never)', 'auto')
  .option('--name-only', 'Show only names of changed files')
  .option('--stat', 'Show diffstat')
  .option('-w, --web', 'Open diff in web browser')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<DiffPRCommand>(ServiceTokens.DiffPRCommand);
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
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
    try {
      const cmd = container.resolve<ListCommentsPRCommand>(
        ServiceTokens.ListCommentsPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCommentsCmd
  .command('add <id> <message>')
  .description('Add a comment to a pull request')
  .action(async (id, message, options) => {
    try {
      const cmd = container.resolve<CommentPRCommand>(
        ServiceTokens.CommentPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(withGlobalOptions({ id, message }, context), context);
    } catch {
      process.exit(1);
    }
  });

prCommentsCmd
  .command('edit <pr-id> <comment-id> <message>')
  .description('Edit a comment on a pull request')
  .action(async (prId, commentId, message, options) => {
    try {
      const cmd = container.resolve<EditCommentPRCommand>(
        ServiceTokens.EditCommentPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ prId, commentId, message }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prCommentsCmd
  .command('delete <pr-id> <comment-id>')
  .description('Delete a comment on a pull request')
  .action(async (prId, commentId, options) => {
    try {
      const cmd = container.resolve<DeleteCommentPRCommand>(
        ServiceTokens.DeleteCommentPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ prId, commentId }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

const prReviewersCmd = new Command('reviewers').description(
  'Manage pull request reviewers'
);

prReviewersCmd
  .command('list <id>')
  .description('List reviewers on a pull request')
  .action(async (id, options) => {
    try {
      const cmd = container.resolve<ListReviewersPRCommand>(
        ServiceTokens.ListReviewersPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prReviewersCmd
  .command('add <id> <username>')
  .description('Add a reviewer to a pull request')
  .action(async (id, username, options) => {
    try {
      const cmd = container.resolve<AddReviewerPRCommand>(
        ServiceTokens.AddReviewerPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, username, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
  });

prReviewersCmd
  .command('remove <id> <username>')
  .description('Remove a reviewer from a pull request')
  .action(async (id, username, options) => {
    try {
      const cmd = container.resolve<RemoveReviewerPRCommand>(
        ServiceTokens.RemoveReviewerPRCommand
      );
      const context = createContext(cli);
      await cmd.execute(
        withGlobalOptions({ id, username, ...options }, context),
        context
      );
    } catch {
      process.exit(1);
    }
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
    try {
      const cmd = container.resolve<GetConfigCommand>(
        ServiceTokens.GetConfigCommand
      );
      await cmd.execute({ key }, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

configCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    try {
      const cmd = container.resolve<SetConfigCommand>(
        ServiceTokens.SetConfigCommand
      );
      await cmd.execute({ key, value }, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

configCmd
  .command('list')
  .description('List all configuration values')
  .action(async () => {
    try {
      const cmd = container.resolve<ListConfigCommand>(
        ServiceTokens.ListConfigCommand
      );
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
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
    try {
      const cmd = container.resolve<InstallCompletionCommand>(
        ServiceTokens.InstallCompletionCommand
      );
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall')
  .description('Uninstall shell completions')
  .action(async () => {
    try {
      const cmd = container.resolve<UninstallCompletionCommand>(
        ServiceTokens.UninstallCompletionCommand
      );
      await cmd.execute(undefined, createContext(cli));
    } catch {
      process.exit(1);
    }
  });

cli.addCommand(completionCmd);
