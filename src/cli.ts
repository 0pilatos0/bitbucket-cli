/**
 * CLI setup with Commander.js
 */

import { Command, Option } from 'commander';
import { createRequire } from 'node:module';
import { bootstrap } from './bootstrap.js';
import { generateCompletions } from './completion.js';
import {
  PullrequestMergeParametersMergeStrategyEnum,
  SnippetsWorkspaceGetRoleEnum,
} from './generated/api.js';
import {
  DEFAULT_PIPELINE_SORT,
  PIPELINE_SORTS,
  PIPELINE_STATUSES,
} from './commands/pipeline/list.command.js';
import { COMMIT_STATUS_STATES } from './commands/status/shared.js';
import {
  ISSUE_KINDS,
  ISSUE_PRIORITIES,
  ISSUE_STATES,
} from './commands/issue/shared.js';
import { WORKSPACE_ROLES } from './commands/workspace/list.command.js';
import { COLOR_WHENS } from './commands/pr/diff.command.js';
import { HTTP_METHODS } from './services/api-passthrough.js';
import { createHelpTextBuilder } from './help-text.js';
import { ServiceTokens } from './core/container.js';
import type { ServiceToken } from './core/container.js';
import type { BaseCommand } from './core/base-command.js';
import type { CommandContext } from './core/interfaces/commands.js';
import type { IOutputService } from './core/interfaces/services.js';
import type { VersionService } from './services/version.service.js';
import type { VersionCheckResult } from './types/version.js';
import type { IConfigService } from './core/interfaces/services.js';
import { PR_STATES } from './types/pr.js';
import { BBError, ErrorCode } from './types/errors.js';
import { buildCommandPath } from './core/command-tree.js';
import { resolveRootInvocation } from './root-dispatch.js';

// Re-exported so `buildCommandPath` keeps its historical import path.
export { buildCommandPath } from './core/command-tree.js';
import { resolveLocale } from './services/locale.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

import tabtab from 'tabtab';

// Enum option values, single-sourced so shell completion and the help-text
// `validValues` blocks can never drift. The merge strategies and snippet roles
// come straight from the generated OpenAPI enums, so `bun run generate:api`
// keeps them current automatically.
const MERGE_STRATEGIES = Object.values(
  PullrequestMergeParametersMergeStrategyEnum
);
const SNIPPET_ROLES = Object.values(SnippetsWorkspaceGetRoleEnum);

/**
 * Advertise an option's allowed values for shell completion (and `--help`)
 * WITHOUT Commander's parse-time enforcement. `generateCompletions` reads
 * `option.argChoices` to suggest enum values, but validation stays in the
 * command handlers (`parseEnumOption`), which raise `BBError` — so `--json`
 * error envelopes, the app's message style, and case-insensitive normalization
 * (e.g. `bb api -X get`) all keep working. Commander only enforces `argChoices`
 * via the `parseArg` that `.choices()` installs, so assigning it directly is
 * completion-only.
 */
function withCompletionChoices(
  option: Option,
  values: readonly string[]
): Option {
  option.argChoices = [...values];
  return option;
}

/**
 * Pull the value of `--locale <locale>` (or `--locale=<locale>`) out of
 * argv before Commander parses it, mirroring how `--no-color` is handled.
 * The locale must influence `OutputService` construction during bootstrap,
 * which runs before any Commander action handlers fire.
 */
export function extractLocaleArg(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === '--locale') {
      const next = argv[i + 1];
      if (typeof next === 'string' && !next.startsWith('-')) {
        return next;
      }
      return undefined;
    }
    if (arg.startsWith('--locale=')) {
      return arg.slice('--locale='.length);
    }
  }
  return undefined;
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

/**
 * Decide whether the CLI should suppress Unicode glyphs (separators, arrows,
 * status icons) and fall back to ASCII. Mirrors the precedence used by `gh`
 * for `GH_NO_UNICODE`: an explicit `--no-unicode` flag wins, otherwise any
 * non-empty `BB_NO_UNICODE` env var enables it. Resolved before Commander
 * parses argv so the OutputService and help-text rendering see the same
 * setting.
 */
export function resolveNoUnicodeSetting(
  argv: string[],
  env: NodeJS.ProcessEnv
): boolean {
  if (argv.includes('--no-unicode')) {
    return true;
  }
  return env.BB_NO_UNICODE !== undefined && env.BB_NO_UNICODE !== '';
}

// Bootstrap the container
const noColor = resolveNoColorSetting(process.argv, process.env);
const noUnicode = resolveNoUnicodeSetting(process.argv, process.env);
const buildHelpText = createHelpTextBuilder(noColor);
const locale = resolveLocale({
  explicit: extractLocaleArg(process.argv),
  env: process.env,
});

const container = bootstrap({ noColor, noUnicode, locale });

// Exact path of the command currently executing (e.g. `pr comments add`),
// derived from Commander's command tree by the root `preAction` hook below and
// read by `createContext`. A module-level value is safe because the CLI runs
// exactly one command per process invocation.
let activeCommandPath = '';

// Helper to create command context. Validation errors from --json/--jq
// parsing are deferred onto `context.validationError` so they can be raised
// inside BaseCommand.run() and rendered through the normal error path,
// instead of escaping a Commander action handler as an unhandled rejection.
export function createContext(
  program: Command,
  options: { allowJqWithoutJson?: boolean } = {}
): CommandContext {
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

  // `--jq` normally requires `--json` to flip list/table commands out of human
  // mode. Commands whose output is already JSON (e.g. `bb api`) opt out via
  // `allowJqWithoutJson`, so `--jq` works standalone there.
  if (
    !validationError &&
    jqOpt !== undefined &&
    !json &&
    !options.allowJqWithoutJson
  ) {
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
      noUnicode: opts.unicode === false || noUnicode,
      noTruncate: opts.truncate === false,
      workspace: opts.workspace,
      repo: opts.repo,
    },
    validationError,
    commandPath: activeCommandPath || undefined,
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

// Build the update-available banner. Pure string-building so it is trivially
// unit-testable; the caller supplies the separator so it can honor --no-unicode.
export function formatUpdateNotice(
  result: VersionCheckResult,
  installCommand: string,
  separator: string
): string {
  return [
    '',
    separator,
    `A new version is available: ${result.latestVersion} (you have ${result.currentVersion})`,
    `  Run '${installCommand}' to update`,
    `  Or disable with 'bb config set skipVersionCheck true'`,
    separator,
    '',
  ].join('\n');
}

// Print the update-available notice to stderr, gated so it never pollutes
// machine-readable output. CI / skip / throttle gating lives inside
// VersionService.checkForUpdate(); here we add the presentation gates: skip in
// JSON mode and when stderr is not an interactive TTY, and route the banner to
// stderr so piped stdout (e.g. `--json`) stays byte-clean.
export async function maybePrintUpdateNotice(
  versionService: VersionService,
  opts: { json?: boolean; noUnicode?: boolean }
): Promise<void> {
  if (opts.json) return;
  if (process.stderr.isTTY !== true) return;

  try {
    const result = await versionService.checkForUpdate();
    if (result?.updateAvailable) {
      const separator = (opts.noUnicode ? '-' : '─').repeat(50);
      process.stderr.write(
        formatUpdateNotice(
          result,
          versionService.getInstallCommand(),
          separator
        ) + '\n'
      );
    }
  } catch {
    // The version check is opportunistic — never block or surface errors.
  }
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
    'Filter the JSON output through a jq expression — runs in-process via embedded jq, requires --json (e.g. \'.pullRequests[] | select(.state == "OPEN") | .title\')'
  )
  .option('--no-color', 'Disable color output')
  .option(
    '--no-unicode',
    'Use ASCII fallbacks for symbols (separators, arrows, status icons) — also enabled by BB_NO_UNICODE'
  )
  .option(
    '--no-truncate',
    'Show full values in table output without truncation'
  )
  .option(
    '--locale <locale>',
    'BCP-47 locale tag for date/time formatting (e.g. de-DE, ja-JP). Falls back to BB_LOCALE, then LC_TIME/LC_ALL/LANG, then en-US.'
  )
  .option(
    '-w, --workspace <workspace>',
    'Specify workspace (falls back to BB_WORKSPACE, then config defaultWorkspace)'
  )
  .option('-r, --repo <repo>', 'Specify repository')
  .addHelpText(
    'after',
    buildHelpText({
      // `bb help <command>` can't appear under `Commands:` — Commander omits
      // its help command whenever the root has an action handler — so advertise
      // it here instead.
      examples: ['bb help pr', 'bb pr list --json'],
      envVars: {
        BB_USERNAME: 'Bitbucket username (fallback for auth login)',
        BB_API_TOKEN: 'Bitbucket API token (fallback for auth login)',
        BB_WORKSPACE:
          'Default workspace (overrides config.defaultWorkspace; --workspace still wins)',
        NO_COLOR: 'Disable color output when set',
        FORCE_COLOR: "Force color output when set (and not '0')",
        BB_NO_UNICODE:
          'Use ASCII fallbacks for symbols when set (any non-empty value)',
        DEBUG: "Enable HTTP debug logging when exactly 'true'",
        BB_LOCALE:
          'BCP-47 locale tag for date/time formatting; --locale takes precedence',
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
    // The update-available check runs in the root `postAction` hook so it fires
    // after every command, not just the bare `bb` invocation handled here.
    const output = container.resolve<IOutputService>(
      ServiceTokens.OutputService
    );

    const jsonOption = cli.opts().json;
    const invocation = resolveRootInvocation(cli, {
      args: cli.args,
      jsonOption,
    });

    if (invocation.kind === 'error') {
      if (jsonOption !== undefined && jsonOption !== false) {
        output.jsonError(invocation.error.toJSON());
      } else {
        output.error(invocation.error.message);
      }
      // Unconditional, matching runCommand(). BaseCommand.handleError() guards
      // on NODE_ENV; this path is driven directly by tests that assert on it.
      process.exitCode = 1;
      return;
    }

    invocation.command.outputHelp();
    if (!invocation.welcome) return;

    // Nudge unauthenticated users toward `bb auth login`. First-run users hit
    // this path immediately after install, so it's the right moment to point
    // at the next step.
    try {
      const configService = container.resolve<IConfigService>(
        ServiceTokens.ConfigService
      );
      const config = await configService.getConfig();
      const hasBasicAuth = Boolean(config.username && config.apiToken);
      const hasOAuth = Boolean(
        config.oauthAccessToken && config.oauthRefreshToken
      );
      if (!hasBasicAuth && !hasOAuth) {
        output.text('');
        output.text(
          `Tip: Run '${output.highlight('bb auth login')}' to get started.`
        );
      }
    } catch {
      // Don't let an unreadable config disrupt the help screen.
    }
  });

// Capture the exact path of the command about to run so `createContext` can
// stamp it onto the context and `BaseCommand.appendHelpHint()` can build an
// accurate `bb <path> --help` footer. Inherited by every subcommand.
cli.hook('preAction', (_thisCommand, actionCommand) => {
  activeCommandPath = buildCommandPath(actionCommand);
});

// Surface an update-available notice after every command (like `gh`). The
// notice prints to stderr and only in interactive, non-JSON, non-CI sessions;
// throttling and the skip flag are enforced inside VersionService. Runs because
// runCommand() and the root action swallow all errors, so no action ever throws
// out to Commander and skips its postAction hooks.
cli.hook('postAction', async (thisCommand) => {
  const versionService = container.resolve<VersionService>(
    ServiceTokens.VersionService
  );
  const jsonOpt = thisCommand.opts().json;
  const json = jsonOpt !== undefined && jsonOpt !== false;
  await maybePrintUpdateNotice(versionService, { json, noUnicode });
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
  .option(
    '--app-password',
    'Use API token authentication (instead of OAuth). App passwords are deprecated; use API tokens.'
  )
  .option(
    '--with-token',
    'Read the API token from stdin (keeps it out of shell history and process args)'
  )
  .option('--client-id <clientId>', 'Custom OAuth consumer client ID')
  .option(
    '--client-secret <clientSecret>',
    'Custom OAuth consumer client secret'
  )
  .addHelpText(
    'before',
    '\nDefault: OAuth (browser-based, recommended).\n' +
      'For CI/CD: API token via --app-password or BB_API_TOKEN env var.\n' +
      'For headless/secret-safe: pipe the token in with --with-token.\n' +
      'OAuth needs a loopback browser (http://localhost:19872/callback); there\n' +
      'is no device-code flow, so use token auth on headless hosts.\n' +
      'Note: Bitbucket app passwords are deprecated; use OAuth or an API token.\n'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb auth login',
        'bb auth login --app-password -u myuser -p mytoken',
        'echo "$BB_API_TOKEN" | bb auth login -u myuser --with-token',
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
  .option('--all', 'List all repositories (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb repo list',
        'bb repo list --limit 50',
        'bb repo list --all',
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
  .option('--all', 'List all comments (overrides --limit)')
  .option('--resolved', 'Only show resolved comments')
  .option('--unresolved', 'Only show unresolved comments')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments list 42',
        'bb pr comments list 42 --no-truncate',
        'bb pr comments list 42 --unresolved',
        'bb pr comments list 42 --all',
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

prCommentsCmd
  .command('view <pr-id> <comment-id>')
  .description('View a single comment on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments view 42 12345',
        'bb pr comments view 42 12345 --json',
      ],
    })
  )
  .action(async (prId, commentId) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewCommentPRCommand,
      withGlobalOptions({ prId, commentId }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('reply <pr-id> <comment-id> <message>')
  .description('Reply to a comment on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments reply 42 12345 "Good catch, fixed."',
        'bb pr comments reply 42 12345 "Fixed in the latest push" --json',
      ],
    })
  )
  .action(async (prId, commentId, message) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ReplyCommentPRCommand,
      withGlobalOptions({ prId, commentId, message }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('resolve <pr-id> <comment-id>')
  .description('Resolve a comment thread on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments resolve 42 12345',
        'bb pr comments resolve 42 12345 --json',
      ],
    })
  )
  .action(async (prId, commentId) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ResolveCommentPRCommand,
      withGlobalOptions({ prId, commentId }, context),
      cli,
      context
    );
  });

prCommentsCmd
  .command('unresolve <pr-id> <comment-id>')
  .description('Reopen a resolved comment thread on a pull request')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr comments unresolve 42 12345',
        'bb pr comments unresolve 42 12345 --json',
      ],
    })
  )
  .action(async (prId, commentId) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.UnresolveCommentPRCommand,
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
  .command('add <id> <user>')
  .description(
    'Add a reviewer to a pull request (user is an account ID or {uuid})'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr reviewers add 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
        'bb pr reviewers add 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
      ],
    })
  )
  .action(async (id, user, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.AddReviewerPRCommand,
      withGlobalOptions({ id, username: user, ...options }, context),
      cli,
      context
    );
  });

prReviewersCmd
  .command('remove <id> <user>')
  .description(
    'Remove a reviewer from a pull request (user is an account ID or {uuid})'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb pr reviewers remove 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
        'bb pr reviewers remove 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
      ],
    })
  )
  .action(async (id, user, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.RemoveReviewerPRCommand,
      withGlobalOptions({ id, username: user, ...options }, context),
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
  .addOption(
    withCompletionChoices(
      new Option(
        '--role <role>',
        'Filter by role (owner, contributor, member)'
      ),
      SNIPPET_ROLES
    )
  )
  .option('--limit <number>', 'Maximum number of snippets to list', '25')
  .option('--all', 'List all snippets (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet list',
        'bb snippet list --role owner',
        'bb snippet list --all',
        'bb snippet list --limit 50 --json',
      ],
      validValues: {
        'Valid roles': [...SNIPPET_ROLES],
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
  .option(
    '-f, --file <path...>',
    'File(s) to include (variadic; pass multiple paths or repeat the flag)'
  )
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
    'Replace/add file(s) (variadic; pass multiple paths or repeat the flag; sends multipart update)'
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
  .option('--all', 'List all comments (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb snippet comments list kypj',
        'bb snippet comments list kypj --all',
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

// Pipeline commands
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListPipelinesCommand,
      withGlobalOptions(options, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewPipelineCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.RunPipelineCommand,
      withGlobalOptions(options, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.StopPipelineCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.LogsPipelineCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(pipelineCmd);

// Commit commands
const commitCmd = new Command('commit').description(
  'Inspect commits in a repository'
);

commitCmd
  .command('list')
  .description('List commits (defaults to the current git branch)')
  .option(
    '--ref <ref>',
    'Branch, tag, or commit to list history for (default: current git branch, falling back to the repository default listing)'
  )
  .option('--limit <number>', 'Maximum number of commits to list', '25')
  .option('--all', 'List all commits (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb commit list',
        'bb commit list --ref main',
        'bb commit list --ref v1.0.0 --limit 50',
        "bb commit list --json --jq '.commits[].hash'",
      ],
      defaults: {
        ref: 'current git branch (repository default listing outside a git repo)',
        limit: '25',
      },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListCommitsCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

commitCmd
  .command('view <sha>')
  .description('View commit details (author, date, parents, full message)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb commit view abc1234',
        'bb commit view abc1234def5678900000000000000000000000000',
        "bb commit view abc1234 --json --jq '.commit.author.raw'",
      ],
    })
  )
  .action(async (sha, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewCommitCommand,
      withGlobalOptions({ sha, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(commitCmd);

// Status commands (commit build statuses)
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListCommitStatusesCommand,
      withGlobalOptions({ sha, ...options }, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.SetCommitStatusCommand,
      withGlobalOptions({ sha, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(statusCmd);

// Issue commands
const issueCmd = new Command('issue').description(
  'Manage issues in the repository issue tracker'
);

issueCmd
  .command('list')
  .description('List issues (defaults to open-ish states: new, open)')
  .addOption(
    withCompletionChoices(
      new Option('--state <state>', 'Filter by exact state'),
      ISSUE_STATES
    )
  )
  .addOption(
    withCompletionChoices(
      new Option('--kind <kind>', 'Filter by kind'),
      ISSUE_KINDS
    )
  )
  .option('--assignee <username>', 'Filter by assignee username')
  .option('--reporter <username>', 'Filter by reporter username')
  .option(
    '--query <q>',
    'Raw Bitbucket q filter expression (replaces the default state filter; AND-ed with other flags)'
  )
  .option('--limit <number>', 'Maximum number of issues to list', '25')
  .option('--all', 'List all issues (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue list',
        'bb issue list --state resolved',
        'bb issue list --kind bug --assignee some.user',
        'bb issue list --query \'priority="blocker" AND state!="closed"\'',
        "bb issue list --json --jq '.issues[].id'",
      ],
      validValues: {
        'Valid states': [...ISSUE_STATES],
        'Valid kinds': [...ISSUE_KINDS],
      },
      defaults: { state: 'new + open', limit: '25' },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListIssuesCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

issueCmd
  .command('view <id>')
  .description('View issue details')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue view 42',
        "bb issue view 42 --json --jq '.issue.state'",
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewIssueCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

issueCmd
  .command('create')
  .description('Create an issue')
  .option('-t, --title <title>', 'Issue title (required)')
  .option('-b, --body <text>', 'Issue description (Markdown)')
  .option('-F, --body-file <file>', 'Read the issue description from a file')
  .addOption(
    withCompletionChoices(
      new Option('--kind <kind>', 'Issue kind'),
      ISSUE_KINDS
    )
  )
  .addOption(
    withCompletionChoices(
      new Option('--priority <priority>', 'Issue priority'),
      ISSUE_PRIORITIES
    )
  )
  .option('--assignee <username>', 'Assign the issue to a user')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue create --title "Crash on login"',
        'bb issue create --title "Crash on login" --kind bug --priority major',
        'bb issue create --title "RFC: new API" --body-file ./rfc.md',
        'bb issue create --title "Crash on login" --json --jq \'.issue.id\'',
      ],
      validValues: {
        'Valid kinds': [...ISSUE_KINDS],
        'Valid priorities': [...ISSUE_PRIORITIES],
      },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CreateIssueCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

issueCmd
  .command('edit <id>')
  .description('Edit an issue (requires at least one change flag)')
  .option('-t, --title <title>', 'New title')
  .option('-b, --body <text>', 'New description (replaces the existing body)')
  .addOption(
    withCompletionChoices(new Option('--kind <kind>', 'New kind'), ISSUE_KINDS)
  )
  .addOption(
    withCompletionChoices(
      new Option('--priority <priority>', 'New priority'),
      ISSUE_PRIORITIES
    )
  )
  .option('--assignee <username>', 'Reassign the issue to a user')
  .addOption(
    withCompletionChoices(
      new Option('--state <state>', 'New state'),
      ISSUE_STATES
    )
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue edit 42 --title "Crash on login (Safari only)"',
        'bb issue edit 42 --state on-hold --priority critical',
        'bb issue edit 42 --assignee some.user --json',
      ],
      validValues: {
        'Valid states': [...ISSUE_STATES],
        'Valid kinds': [...ISSUE_KINDS],
        'Valid priorities': [...ISSUE_PRIORITIES],
      },
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.EditIssueCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

issueCmd
  .command('close <id>')
  .description('Close an issue (optionally posting a closing comment first)')
  .option('-c, --comment <text>', 'Post this comment before closing')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue close 42',
        'bb issue close 42 --comment "Fixed in 1.4.2"',
        "bb issue close 42 --json --jq '.issue.state'",
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CloseIssueCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

issueCmd
  .command('comment <id>')
  .description('Add a comment to an issue')
  .option('-b, --body <text>', 'Comment text (Markdown, required)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb issue comment 42 --body "Reproduced on main"',
        'bb issue comment 42 --body "Reproduced on main" --json --jq \'.comment.id\'',
      ],
    })
  )
  .action(async (id, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CommentIssueCommand,
      withGlobalOptions({ id, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(issueCmd);

// Workspace commands
const workspaceCmd = new Command('workspace').description(
  'Discover and inspect Bitbucket workspaces'
);

workspaceCmd
  .command('list')
  .description('List workspaces you have access to')
  .addOption(
    withCompletionChoices(
      new Option(
        '--role <role>',
        'Filter by your role (owner, collaborator, member)'
      ),
      WORKSPACE_ROLES
    )
  )
  .option('--limit <number>', 'Maximum number of workspaces to list', '25')
  .option('--all', 'List all workspaces (overrides --limit)')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb workspace list',
        'bb workspace list --role owner',
        "bb workspace list --json --jq '.workspaces[].slug'",
      ],
      validValues: { 'Valid roles': [...WORKSPACE_ROLES] },
      defaults: { limit: '25' },
    })
  )
  .action(async (options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListWorkspacesCommand,
      withGlobalOptions(options, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewWorkspaceCommand,
      withGlobalOptions({ slug, ...options }, context),
      cli,
      context
    );
  });

cli.addCommand(workspaceCmd);

// Project commands
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ListProjectsCommand,
      withGlobalOptions(options, context),
      cli,
      context
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.ViewProjectCommand,
      withGlobalOptions({ key, ...options }, context),
      cli,
      context
    );
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
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.CreateProjectCommand,
      withGlobalOptions(options, context),
      cli,
      context
    );
  });

cli.addCommand(projectCmd);

// Browse command (top-level)
cli
  .command('browse [target]')
  .description(
    'Open a Bitbucket page (repo home, file, PR, commit, etc.) in your browser'
  )
  .option('--pr <id>', 'Open a specific pull request')
  .option('--prs', 'Open the pull-requests list')
  .option('--pull-requests', 'Alias for --prs')
  .option(
    '--branch <name>',
    'Open the branch source tree (or, with <target>, that path on the branch)'
  )
  .option('--branches', 'Open the branches list')
  .option(
    '--commit [sha]',
    'Open a specific commit (defaults to HEAD when no SHA is given)'
  )
  .option('--commits', 'Open the commits list')
  .option('--pipelines', 'Open the pipelines page')
  .option('--pipeline <id>', 'Open a specific pipeline run')
  .option('--downloads', 'Open the downloads page')
  .option('--issue <id>', 'Open a specific issue')
  .option('--issues', 'Open the issue tracker')
  .option('--wiki', 'Open the wiki')
  .option('--settings', 'Open repository settings')
  .option('-n, --no-browser', 'Print the URL to stdout instead of opening it')
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb browse',
        'bb browse src/cli.ts',
        'bb browse src/cli.ts:42',
        'bb browse --branch release/2.0 src/cli.ts',
        'bb browse 217',
        'bb browse --pr 217',
        'bb browse --prs',
        'bb browse abc1234',
        'bb browse --commit',
        'bb browse --pipelines',
        'bb browse --settings',
        'bb browse --pr 217 --no-browser',
        'bb browse --pr 217 --json url',
      ],
    })
  )
  .action(async (target, options) => {
    const context = createContext(cli);
    await runCommand(
      ServiceTokens.BrowseCommand,
      withGlobalOptions({ target, ...options }, context),
      cli,
      context
    );
  });

// API passthrough command (top-level)
const collectRepeated = (value: string, previous: string[]): string[] =>
  previous.concat([value]);

cli
  .command('api [methodOrEndpoint] [endpoint]')
  .description(
    'Make an authenticated request to any Bitbucket Cloud 2.0 API endpoint'
  )
  .addOption(
    withCompletionChoices(
      new Option(
        '-X, --method <method>',
        'HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS). Defaults to GET, or POST when fields/body are present.'
      ),
      HTTP_METHODS
    )
  )
  .option(
    '-f, --raw-field <key=value>',
    'Add a string parameter — query param on GET/HEAD, JSON body field otherwise (repeatable)',
    collectRepeated,
    [] as string[]
  )
  .option(
    '-F, --field <key=value>',
    'Add a typed parameter: true/false/null and numbers are converted; @file reads a file and @- reads stdin (repeatable)',
    collectRepeated,
    [] as string[]
  )
  .option(
    '--input <file>',
    'Read the request body from a file, or - for stdin (sent as application/json; mutually exclusive with -f/-F)'
  )
  .option(
    '-H, --header <key:value>',
    'Add a request header (repeatable). Authorization is managed automatically and cannot be set here.',
    collectRepeated,
    [] as string[]
  )
  .option(
    '-i, --include',
    'Print the HTTP status line and response headers before the body (text mode only)'
  )
  .option(
    '--paginate',
    'Follow the cursor (next) and merge every page into a single {"values": [...]} result (GET/HEAD only)'
  )
  .addHelpText(
    'before',
    '\nEscape hatch for endpoints not yet wrapped by a typed command.\n' +
      'The path is relative to https://api.bitbucket.org/2.0; {workspace} and\n' +
      '{repo} placeholders are filled from --workspace/--repo or the current repo.\n'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb api /user',
        'bb api GET /user',
        'bb api /repositories/{workspace}/{repo}/pullrequests --paginate',
        'bb api POST /repositories/my-ws/my-repo/issues -f title=Bug -F priority=3',
        'bb api PUT /repositories/my-ws/my-repo/pullrequests/42 --input body.json',
        'cat body.json | bb api POST /repositories/my-ws/my-repo/pullrequests/42/comments --input -',
        "bb api /repositories/my-ws --jq '.values[].name'",
        'bb api -i /user',
      ],
      validValues: {
        'Valid methods': [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'HEAD',
          'OPTIONS',
        ],
      },
      seeAlso: [
        {
          label: 'Scripting & Automation',
          url: 'https://bitbucket-cli.paulvanderlei.com/guides/scripting/',
        },
        {
          label: 'Bitbucket REST API',
          url: 'https://developer.atlassian.com/cloud/bitbucket/rest/intro/',
        },
      ],
    })
  )
  .action(async (methodOrEndpoint, endpoint, options) => {
    // `bb api` output is already JSON, so `--jq` works without `--json`.
    const context = createContext(cli, { allowJqWithoutJson: true });
    await runCommand(
      ServiceTokens.ApiCommand,
      withGlobalOptions({ methodOrEndpoint, endpoint, ...options }, context),
      cli,
      context
    );
  });

// Alias commands
const aliasCmd = new Command('alias').description(
  'Create shortcuts for bb commands'
);

aliasCmd
  .command('set <name> <expansion>')
  .description(
    'Create or update an alias; supports $1-$9 placeholders and a ! prefix for shell passthrough'
  )
  .addHelpText(
    'before',
    '\nAn alias expands in place of the first bb argument: `bb co 42` runs\n' +
      '`bb pr checkout 42` after `bb alias set co "pr checkout $1"`. Extra\n' +
      'arguments are appended unless consumed by $1-$9 placeholders. A `!`\n' +
      'prefix runs the expansion through `sh -c` instead, with the remaining\n' +
      'arguments available as shell positional parameters ($1, $@).\n'
  )
  .addHelpText(
    'after',
    buildHelpText({
      examples: [
        'bb alias set co "pr checkout $1"',
        'bb alias set prd "pr create --draft"',
        'bb alias set openpr \'!bb pr list --json --jq ".pullRequests[0].id" | xargs bb browse --pr\'',
      ],
      seeAlso: [
        {
          label: 'Configuration File',
          url: 'https://bitbucket-cli.paulvanderlei.com/reference/configuration/',
        },
      ],
    })
  )
  .action(async (name, expansion) => {
    await runCommand(ServiceTokens.SetAliasCommand, { name, expansion }, cli);
  });

aliasCmd
  .command('list')
  .description('List configured aliases')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb alias list', 'bb alias list --json'],
    })
  )
  .action(async () => {
    await runCommand(ServiceTokens.ListAliasesCommand, undefined, cli);
  });

aliasCmd
  .command('delete <name>')
  .description('Delete an alias')
  .addHelpText(
    'after',
    buildHelpText({
      examples: ['bb alias delete co', 'bb alias delete co --json'],
    })
  )
  .action(async (name) => {
    await runCommand(ServiceTokens.DeleteAliasCommand, { name }, cli);
  });

cli.addCommand(aliasCmd);

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

// Let unknown top-level tokens reach the root action (which turns them into a
// "did you mean" error) instead of Commander's bare "too many arguments".
//
// PLACEMENT IS LOAD-BEARING: `copyInheritedSettings()` copies
// `_allowExcessArguments` to each subcommand created via `.command()`, and it
// runs at creation time. Calling this before the tree is built would silently
// disable arity checking on `browse` and `api` (so `bb browse x y` would stop
// erroring) while still missing every group attached with `addCommand()`.
// tests/cli-unknown-command.test.ts pins that only the root is affected.
cli.allowExcessArguments();

// Handle tabtab shell completion. This runs at module load (the entrypoint
// imports `cli` before calling parseAsync), and must come AFTER the command
// tree is fully built so `generateCompletions` can walk the live `cli` tree.
// bootstrap() above only registers lazy DI factories — no I/O — so reaching
// this point stays fast and silent, as shell completion requires.
if (process.argv.includes('--get-yargs-completions') || process.env.COMP_LINE) {
  const env = tabtab.parseEnv(process.env);
  if (env.complete) {
    tabtab.log(generateCompletions(cli, env));
    process.exit(0);
  }
}
