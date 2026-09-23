/**
 * CLI composition root: resolves process-level settings, bootstraps the DI
 * container, configures the root `bb` program (global flags, root action,
 * lifecycle hooks), and lets each command group register its own subtree.
 */

import { createRequire } from 'node:module';
import { Command } from 'commander';
import tabtab from 'tabtab';
import { bootstrap } from './bootstrap.js';
import { registerCommands } from './commands/register.js';
import { generateCompletions } from './completion.js';
import { createHelpTextBuilder } from './help-text.js';
import { ServiceTokens } from './core/container.js';
import type { ServiceToken } from './core/container.js';
import type { BaseCommand } from './core/base-command.js';
import type {
  CommandRegistrar,
  ContextOptions,
} from './core/command-registrar.js';
import type { CommandContext } from './core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
  IPromptService,
} from './core/interfaces/services.js';
import type { VersionService } from './services/version.service.js';
import type { VersionCheckResult } from './types/version.js';
import { BBError, ErrorCode } from './types/errors.js';
import { buildCommandPath } from './core/command-tree.js';
import { resolveRootInvocation } from './root-dispatch.js';
import { resolveLocale } from './services/locale.js';

// Re-exported so `buildCommandPath` keeps its historical import path.
export { buildCommandPath } from './core/command-tree.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

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
  options: ContextOptions = {}
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
    prompt: json || opts.input === false ? undefined : availablePrompt(),
  };
}

function availablePrompt(): IPromptService | undefined {
  const prompt = container.resolve<IPromptService>(ServiceTokens.PromptService);
  return prompt.isAvailable() ? prompt : undefined;
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
    '--no-input',
    'Never prompt, even in an interactive terminal, except in completion install (also enabled by BB_PROMPT_DISABLED)'
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
        BB_PROMPT_DISABLED: 'Same as --no-input when set (any non-empty value)',
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

const registrar: CommandRegistrar = {
  buildHelpText,
  run: async (token, options) => {
    await runCommand(token, options, cli);
  },
  runWithGlobalOptions: async (token, options, contextOptions) => {
    const context = createContext(cli, contextOptions);
    await runCommand(token, withGlobalOptions(options, context), cli, context);
  },
};

registerCommands(cli, registrar);

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
