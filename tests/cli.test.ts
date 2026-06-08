/**
 * CLI helper tests
 */

import { describe, it, expect } from 'bun:test';
import type { Command } from 'commander';
import {
  buildCommandPath,
  createContext,
  extractLocaleArg,
  formatUpdateNotice,
  maybePrintUpdateNotice,
  resolveNoColorSetting,
  resolveNoUnicodeSetting,
  withGlobalOptions,
} from '../src/cli.js';
import { cli } from '../src/cli.js';
import type { CommandContext } from '../src/core/interfaces/commands.js';
import type { VersionService } from '../src/services/version.service.js';
import type { VersionCheckResult } from '../src/types/version.js';

describe('createContext --jq / --json validation', () => {
  const fakeProgram = (opts: Record<string, unknown>): Command =>
    ({ opts: () => opts }) as unknown as Command;

  it('rejects --jq without --json by default', () => {
    const context = createContext(fakeProgram({ jq: '.x' }));
    expect(context.validationError).toBeDefined();
    expect(context.validationError?.message).toContain('--jq requires --json');
  });

  it('allows --jq without --json when allowJqWithoutJson is set (bb api)', () => {
    const context = createContext(fakeProgram({ jq: '.x' }), {
      allowJqWithoutJson: true,
    });
    expect(context.validationError).toBeUndefined();
    expect(context.globalOptions.jq).toBe('.x');
  });
});

describe('withGlobalOptions', () => {
  it('should use global workspace when local is not provided', () => {
    const options = { limit: '10' };
    const context: CommandContext = {
      globalOptions: { workspace: 'global-workspace' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBe('global-workspace');
    expect(result.limit).toBe('10');
  });

  it('should use global repo when local is not provided', () => {
    const options = { limit: '10' };
    const context: CommandContext = {
      globalOptions: { repo: 'global-repo' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.repo).toBe('global-repo');
    expect(result.limit).toBe('10');
  });

  it('should prefer local workspace over global', () => {
    const options = { workspace: 'local-workspace', limit: '10' };
    const context: CommandContext = {
      globalOptions: { workspace: 'global-workspace' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBe('local-workspace');
  });

  it('should prefer local repo over global', () => {
    const options = { repo: 'local-repo', limit: '10' };
    const context: CommandContext = {
      globalOptions: { repo: 'global-repo' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.repo).toBe('local-repo');
  });

  it('should merge both workspace and repo from global options', () => {
    const options = { state: 'OPEN' };
    const context: CommandContext = {
      globalOptions: { workspace: 'test-workspace', repo: 'test-repo' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBe('test-workspace');
    expect(result.repo).toBe('test-repo');
    expect(result.state).toBe('OPEN');
  });

  it('should handle empty global options', () => {
    const options = { limit: '25' };
    const context: CommandContext = {
      globalOptions: {},
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBeUndefined();
    expect(result.repo).toBeUndefined();
    expect(result.limit).toBe('25');
  });

  it('should handle undefined values in local options', () => {
    const options = { workspace: undefined, repo: undefined, limit: '5' };
    const context: CommandContext = {
      globalOptions: { workspace: 'fallback-workspace', repo: 'fallback-repo' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBe('fallback-workspace');
    expect(result.repo).toBe('fallback-repo');
    expect(result.limit).toBe('5');
  });

  it('should preserve all other options', () => {
    const options = {
      title: 'My PR',
      body: 'Description',
      source: 'feature-branch',
      destination: 'main',
    };
    const context: CommandContext = {
      globalOptions: { workspace: 'ws', repo: 'r' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.title).toBe('My PR');
    expect(result.body).toBe('Description');
    expect(result.source).toBe('feature-branch');
    expect(result.destination).toBe('main');
    expect(result.workspace).toBe('ws');
    expect(result.repo).toBe('r');
  });

  it('should handle json global option (not merged into options)', () => {
    const options = { limit: '10' };
    const context: CommandContext = {
      globalOptions: { json: true, workspace: 'ws' },
    };

    const result = withGlobalOptions(options, context);

    expect(result.workspace).toBe('ws');
    // json should not be in result as it's only in globalOptions
    expect((result as Record<string, unknown>).json).toBeUndefined();
  });
});

describe('resolveNoColorSetting', () => {
  it('should enable noColor when --no-color is passed', () => {
    const noColor = resolveNoColorSetting(
      ['node', 'bb', '--no-color'],
      {} as NodeJS.ProcessEnv
    );

    expect(noColor).toBe(true);
  });

  it('should enable noColor when NO_COLOR is set', () => {
    const noColor = resolveNoColorSetting(['node', 'bb'], {
      NO_COLOR: '1',
    } as NodeJS.ProcessEnv);

    expect(noColor).toBe(true);
  });

  it('should prefer FORCE_COLOR over NO_COLOR and --no-color', () => {
    const noColor = resolveNoColorSetting(['node', 'bb', '--no-color'], {
      NO_COLOR: '1',
      FORCE_COLOR: '1',
    } as NodeJS.ProcessEnv);

    expect(noColor).toBe(false);
  });

  it('should allow --color to override NO_COLOR', () => {
    const noColor = resolveNoColorSetting(['node', 'bb', '--color'], {
      NO_COLOR: '1',
    } as NodeJS.ProcessEnv);

    expect(noColor).toBe(false);
  });
});

describe('resolveNoUnicodeSetting', () => {
  it('should disable unicode when --no-unicode is passed', () => {
    const noUnicode = resolveNoUnicodeSetting(
      ['node', 'bb', '--no-unicode'],
      {} as NodeJS.ProcessEnv
    );

    expect(noUnicode).toBe(true);
  });

  it('should disable unicode when BB_NO_UNICODE env var is set', () => {
    const noUnicode = resolveNoUnicodeSetting(['node', 'bb'], {
      BB_NO_UNICODE: '1',
    } as NodeJS.ProcessEnv);

    expect(noUnicode).toBe(true);
  });

  it('should not disable unicode when BB_NO_UNICODE is empty', () => {
    const noUnicode = resolveNoUnicodeSetting(['node', 'bb'], {
      BB_NO_UNICODE: '',
    } as NodeJS.ProcessEnv);

    expect(noUnicode).toBe(false);
  });

  it('should default to false when neither flag nor env var is present', () => {
    const noUnicode = resolveNoUnicodeSetting(
      ['node', 'bb'],
      {} as NodeJS.ProcessEnv
    );

    expect(noUnicode).toBe(false);
  });
});

describe('extractLocaleArg', () => {
  it('returns the value passed as a separate argument', () => {
    expect(
      extractLocaleArg(['node', 'bb', 'pr', 'list', '--locale', 'de-DE'])
    ).toBe('de-DE');
  });

  it('supports the --locale=value form', () => {
    expect(
      extractLocaleArg(['node', 'bb', 'pr', 'list', '--locale=ja-JP'])
    ).toBe('ja-JP');
  });

  it('returns undefined when --locale is absent', () => {
    expect(extractLocaleArg(['node', 'bb', 'pr', 'list'])).toBeUndefined();
  });

  it('returns undefined when --locale is followed by another flag', () => {
    // Without a value Commander would also error; treat it as unset rather
    // than swallowing the next flag as the locale value.
    expect(
      extractLocaleArg(['node', 'bb', '--locale', '--json'])
    ).toBeUndefined();
  });

  it('returns undefined when --locale is the trailing token', () => {
    expect(extractLocaleArg(['node', 'bb', '--locale'])).toBeUndefined();
  });

  it('returns the empty string for --locale=""', () => {
    // Preserves the literal value so resolveLocale can decide how to treat
    // it (whitespace-only values are normalised to "fall through").
    expect(extractLocaleArg(['node', 'bb', '--locale='])).toBe('');
  });
});

describe('CLI option wiring', () => {
  it('should reserve -w for global --workspace and keep pr diff --web long-only', () => {
    const workspaceOption = cli.options.find(
      (option) => option.long === '--workspace'
    );
    expect(workspaceOption?.short).toBe('-w');

    const prCommand = cli.commands.find((command) => command.name() === 'pr');
    expect(prCommand).toBeDefined();

    const diffCommand = prCommand?.commands.find(
      (command) => command.name() === 'diff'
    );
    expect(diffCommand).toBeDefined();

    const webOption = diffCommand?.options.find(
      (option) => option.long === '--web'
    );
    expect(webOption).toBeDefined();
    expect(webOption?.short).toBeUndefined();
    expect(diffCommand?.options.some((option) => option.short === '-w')).toBe(
      false
    );
  });
});

// Matches CSI ANSI escape sequences (colors, formatting). Chalk emits these
// whenever the local `new Chalk({ level: 1 })` in help-text.ts is active —
// i.e. whenever the CLI is built with noColor=false, which is the default
// under `bun test` in a TTY. Strip them so help-text assertions work in
// both piped and interactive runs.
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;

function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '');
}

function captureHelp(
  cmd: InstanceType<typeof import('commander').Command>
): string {
  let output = '';
  cmd.configureOutput({
    writeOut: (str: string) => {
      output += str;
    },
  });
  cmd.outputHelp();
  return stripAnsi(output);
}

describe('CLI help text integration', () => {
  it('should include environment variables in root help', () => {
    const output = captureHelp(cli);

    expect(output).toContain('Environment variables:');
    expect(output).toContain('BB_USERNAME');
    expect(output).toContain('BB_API_TOKEN');
    expect(output).toContain('BB_WORKSPACE');
    expect(output).toContain('NO_COLOR');
    expect(output).toContain('FORCE_COLOR');
    expect(output).toContain('BB_NO_UNICODE');
    expect(output).toContain('DEBUG');
    expect(output).toContain('BB_LOCALE');
  });

  it('should include merge strategies and examples in pr merge help', () => {
    const prCmd = cli.commands.find((c) => c.name() === 'pr')!;
    const mergeCmd = prCmd.commands.find((c) => c.name() === 'merge')!;
    const output = captureHelp(mergeCmd);

    expect(output).toContain('Examples:');
    expect(output).toContain('$ bb pr merge 42');
    expect(output).toContain('Valid merge strategies:');
    expect(output).toContain('merge_commit');
    expect(output).toContain('squash');
    expect(output).toContain('fast_forward');
    expect(output).toContain('squash_fast_forward');
    expect(output).toContain('rebase_fast_forward');
    expect(output).toContain('rebase_merge');
  });

  it('should include env var fallbacks in auth login help', () => {
    const authCmd = cli.commands.find((c) => c.name() === 'auth')!;
    const loginCmd = authCmd.commands.find((c) => c.name() === 'login')!;
    const output = captureHelp(loginCmd);

    expect(output).toContain('Examples:');
    expect(output).toContain('BB_USERNAME');
    expect(output).toContain('BB_API_TOKEN');
  });

  it('should include settable keys in config set help', () => {
    const configCmd = cli.commands.find((c) => c.name() === 'config')!;
    const setCmd = configCmd.commands.find((c) => c.name() === 'set')!;
    const output = captureHelp(setCmd);

    expect(output).toContain('Examples:');
    expect(output).toContain('Settable config keys:');
    expect(output).toContain('defaultWorkspace');
    expect(output).toContain('skipVersionCheck');
    expect(output).toContain('versionCheckInterval');
    // Issue #181: prCreateIncludeDefaultReviewers must be discoverable from
    // `bb config set --help` so users learn about it without grepping the docs.
    expect(output).toContain('prCreateIncludeDefaultReviewers');
  });

  it('should list prCreateIncludeDefaultReviewers in config get readable keys', () => {
    const configCmd = cli.commands.find((c) => c.name() === 'config')!;
    const getCmd = configCmd.commands.find((c) => c.name() === 'get')!;
    const output = captureHelp(getCmd);

    expect(output).toContain('Readable config keys:');
    expect(output).toContain('prCreateIncludeDefaultReviewers');
  });

  it('should describe --mine without ambiguity (reviewer, not author)', () => {
    const prCmd = cli.commands.find((c) => c.name() === 'pr')!;
    const listCmd = prCmd.commands.find((c) => c.name() === 'list')!;
    const output = captureHelp(listCmd);

    // The natural reading of "PRs where you are a reviewer" is ambiguous;
    // help must spell out it excludes PRs you authored. Commander wraps the
    // option description, so collapse whitespace before asserting.
    const flat = output.replace(/\s+/g, ' ');
    expect(flat).toContain('not authored by you');
  });

  it('should mark app passwords as deprecated in auth login --app-password help', () => {
    const authCmd = cli.commands.find((c) => c.name() === 'auth')!;
    const loginCmd = authCmd.commands.find((c) => c.name() === 'login')!;
    const output = captureHelp(loginCmd);

    expect(output).toContain('--app-password');
    expect(output).toContain('API token authentication');
    expect(output).toContain('App passwords are deprecated');
  });

  it('should advertise variadic --file in snippet create help', () => {
    const snippetCmd = cli.commands.find((c) => c.name() === 'snippet')!;
    const createCmd = snippetCmd.commands.find((c) => c.name() === 'create')!;
    const output = captureHelp(createCmd);

    // Issue #181: --file is variadic but help didn't say so.
    expect(output).toContain('variadic');
    expect(output).toContain('-f config.yml -f setup.sh');
  });

  it('should show pr reviewers add/remove accept account ID or UUID', () => {
    const prCmd = cli.commands.find((c) => c.name() === 'pr')!;
    const reviewersCmd = prCmd.commands.find((c) => c.name() === 'reviewers')!;
    const addCmd = reviewersCmd.commands.find((c) => c.name() === 'add')!;
    const removeCmd = reviewersCmd.commands.find((c) => c.name() === 'remove')!;

    const addOutput = captureHelp(addCmd);
    expect(addOutput).toContain('<user>');
    expect(addOutput).toContain('account ID');
    expect(addOutput).toContain('{uuid}');

    const removeOutput = captureHelp(removeCmd);
    expect(removeOutput).toContain('<user>');
    expect(removeOutput).toContain('account ID');
    expect(removeOutput).toContain('{uuid}');
  });
});

function findCommand(...path: string[]): Command | undefined {
  let current: Command | undefined = cli;
  for (const name of path) {
    current = current?.commands.find((command) => command.name() === name);
    if (!current) {
      return undefined;
    }
  }
  return current;
}

function requireCommand(...path: string[]): Command {
  const command = findCommand(...path);
  if (!command) {
    throw new Error(`Command not registered: ${['bb', ...path].join(' ')}`);
  }
  return command;
}

function hasOption(command: Command, long: string): boolean {
  return command.options.some((option) => option.long === long);
}

function hasShortOption(command: Command, short: string): boolean {
  return command.options.some((option) => option.short === short);
}

function collectLeafCommands(root: Command): Command[] {
  const leaves: Command[] = [];
  const queue: Command[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.commands.length === 0) {
      leaves.push(node);
    } else {
      queue.push(...node.commands);
    }
  }
  return leaves;
}

describe('CLI command registration', () => {
  it('should register all top-level commands', () => {
    const names = cli.commands.map((command) => command.name()).sort();
    expect(names).toEqual([
      'api',
      'auth',
      'browse',
      'completion',
      'config',
      'pr',
      'repo',
      'snippet',
    ]);
  });

  it('should register global --workspace, --repo, --json, --jq, --no-color, --no-unicode, --no-truncate and --locale options on root', () => {
    expect(hasOption(cli, '--workspace')).toBe(true);
    expect(hasOption(cli, '--repo')).toBe(true);
    expect(hasOption(cli, '--json')).toBe(true);
    expect(hasOption(cli, '--jq')).toBe(true);
    expect(hasOption(cli, '--no-color')).toBe(true);
    expect(hasOption(cli, '--no-unicode')).toBe(true);
    expect(hasOption(cli, '--no-truncate')).toBe(true);
    expect(hasOption(cli, '--locale')).toBe(true);
    expect(hasShortOption(cli, '-w')).toBe(true);
    expect(hasShortOption(cli, '-r')).toBe(true);
  });

  it('should make --json accept an optional field-list argument', () => {
    const jsonOption = cli.options.find((option) => option.long === '--json');
    expect(jsonOption?.optional).toBe(true);
    expect(jsonOption?.required).toBe(false);
  });

  it('should make --jq require a value argument', () => {
    const jqOption = cli.options.find((option) => option.long === '--jq');
    expect(jqOption?.required).toBe(true);
  });

  it('should register all auth subcommands', () => {
    const authCmd = requireCommand('auth');
    const names = authCmd.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['login', 'logout', 'status', 'token']);
  });

  it('should register all repo subcommands (including default-reviewers)', () => {
    const repoCmd = requireCommand('repo');
    const names = repoCmd.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'clone',
      'create',
      'default-reviewers',
      'delete',
      'list',
      'view',
    ]);

    const drCmd = requireCommand('repo', 'default-reviewers');
    const drNames = drCmd.commands.map((c) => c.name()).sort();
    expect(drNames).toEqual(['add', 'list', 'remove']);
  });

  it('should register all pr subcommands (including comments and reviewers)', () => {
    const prCmd = requireCommand('pr');
    const names = prCmd.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'activity',
      'approve',
      'checkout',
      'checks',
      'comments',
      'create',
      'decline',
      'diff',
      'edit',
      'list',
      'merge',
      'ready',
      'reviewers',
      'view',
    ]);

    const commentsCmd = requireCommand('pr', 'comments');
    expect(commentsCmd.commands.map((c) => c.name()).sort()).toEqual([
      'add',
      'delete',
      'edit',
      'list',
    ]);

    const reviewersCmd = requireCommand('pr', 'reviewers');
    expect(reviewersCmd.commands.map((c) => c.name()).sort()).toEqual([
      'add',
      'list',
      'remove',
    ]);
  });

  it('should register all snippet subcommands (including comments)', () => {
    const snippetCmd = requireCommand('snippet');
    expect(snippetCmd.commands.map((c) => c.name()).sort()).toEqual([
      'comments',
      'create',
      'delete',
      'edit',
      'list',
      'unwatch',
      'view',
      'watch',
    ]);

    const commentsCmd = requireCommand('snippet', 'comments');
    expect(commentsCmd.commands.map((c) => c.name()).sort()).toEqual([
      'add',
      'delete',
      'edit',
      'list',
    ]);
  });

  it('should register all config and completion subcommands', () => {
    const configCmd = requireCommand('config');
    expect(configCmd.commands.map((c) => c.name()).sort()).toEqual([
      'get',
      'list',
      'set',
    ]);

    const completionCmd = requireCommand('completion');
    expect(completionCmd.commands.map((c) => c.name()).sort()).toEqual([
      'install',
      'uninstall',
    ]);
  });

  it('should wire an action handler for every leaf command', () => {
    const leaves = collectLeafCommands(cli);
    // root counts as a leaf (no subcommands of its own once flattened through queues
    // with commands), so we verify every leaf has _actionHandler.
    for (const leaf of leaves) {
      const handler = (leaf as unknown as { _actionHandler?: unknown })
        ._actionHandler;
      expect(handler).toBeDefined();
    }

    // Sanity check: we covered a reasonable number of leaves.
    expect(leaves.length).toBeGreaterThanOrEqual(40);
  });

  it('should attach addHelpText("after") with at least one example to every leaf command', () => {
    // Commander implements `addHelpText('after', ...)` by registering a
    // listener for the `afterHelp` event. We assert each leaf command has at
    // least one such listener and renders an "Examples:" section, so help
    // coverage cannot silently regress on new commands. See issue #187.
    const leaves = collectLeafCommands(cli);
    const missing: string[] = [];
    for (const leaf of leaves) {
      if (leaf.listenerCount('afterHelp') < 1) {
        missing.push(leaf.name());
        continue;
      }
      const help = captureHelp(leaf);
      if (!help.includes('Examples:') || !help.includes('$ bb ')) {
        missing.push(leaf.name());
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('CLI leaf command options', () => {
  it('should wire pr create reviewer flags correctly', () => {
    const create = requireCommand('pr', 'create');
    expect(hasOption(create, '--title')).toBe(true);
    expect(hasOption(create, '--body')).toBe(true);
    expect(hasOption(create, '--source')).toBe(true);
    expect(hasOption(create, '--destination')).toBe(true);
    expect(hasOption(create, '--draft')).toBe(true);
    expect(hasOption(create, '--close-source-branch')).toBe(true);
    expect(hasOption(create, '--reviewer')).toBe(true);
    expect(hasOption(create, '--default-reviewers')).toBe(true);
    // Commander stores --no-<opt> as a "negated" option; still discoverable via long.
    expect(
      create.options.some((option) => option.long === '--no-default-reviewers')
    ).toBe(true);
  });

  it('should wire pr list filter options with defaults', () => {
    const list = requireCommand('pr', 'list');
    const stateOption = list.options.find(
      (option) => option.long === '--state'
    );
    expect(stateOption).toBeDefined();
    expect(stateOption?.defaultValue).toBe('OPEN');
    expect(hasOption(list, '--limit')).toBe(true);
    expect(hasOption(list, '--mine')).toBe(true);
  });

  it('should wire pr merge strategy and message options', () => {
    const merge = requireCommand('pr', 'merge');
    expect(hasOption(merge, '--strategy')).toBe(true);
    expect(hasOption(merge, '--message')).toBe(true);
    expect(hasOption(merge, '--close-source-branch')).toBe(true);
  });

  it('should wire pr diff color/stat/name-only/web options', () => {
    const diff = requireCommand('pr', 'diff');
    const colorOption = diff.options.find(
      (option) => option.long === '--color'
    );
    expect(colorOption?.defaultValue).toBe('auto');
    expect(hasOption(diff, '--name-only')).toBe(true);
    expect(hasOption(diff, '--stat')).toBe(true);
    expect(hasOption(diff, '--web')).toBe(true);
  });

  it('should wire pr comments add inline options', () => {
    const add = requireCommand('pr', 'comments', 'add');
    expect(hasOption(add, '--file')).toBe(true);
    expect(hasOption(add, '--line-to')).toBe(true);
    expect(hasOption(add, '--line-from')).toBe(true);
  });

  it('should gate destructive commands behind --yes', () => {
    expect(hasOption(requireCommand('repo', 'delete'), '--yes')).toBe(true);
    expect(hasOption(requireCommand('snippet', 'delete'), '--yes')).toBe(true);
    expect(hasOption(requireCommand('pr', 'comments', 'delete'), '--yes')).toBe(
      true
    );
    expect(
      hasOption(requireCommand('snippet', 'comments', 'delete'), '--yes')
    ).toBe(true);
    expect(
      hasOption(requireCommand('repo', 'default-reviewers', 'remove'), '--yes')
    ).toBe(true);
  });

  it('should wire auth login OAuth override options', () => {
    const login = requireCommand('auth', 'login');
    expect(hasOption(login, '--username')).toBe(true);
    expect(hasOption(login, '--password')).toBe(true);
    expect(hasOption(login, '--app-password')).toBe(true);
    expect(hasOption(login, '--client-id')).toBe(true);
    expect(hasOption(login, '--client-secret')).toBe(true);
  });

  it('should wire snippet create/edit file and visibility flags', () => {
    const create = requireCommand('snippet', 'create');
    expect(hasOption(create, '--title')).toBe(true);
    expect(hasOption(create, '--file')).toBe(true);
    expect(hasOption(create, '--private')).toBe(true);
    expect(hasOption(create, '--public')).toBe(true);

    const edit = requireCommand('snippet', 'edit');
    expect(hasOption(edit, '--title')).toBe(true);
    expect(hasOption(edit, '--file')).toBe(true);
    expect(hasOption(edit, '--private')).toBe(true);
    expect(hasOption(edit, '--public')).toBe(true);
  });

  it('should declare required positional args for pr view/merge/approve', () => {
    // Commander 11+: registeredArguments is an array with { required }.
    function required(command: Command): string[] {
      const args = (
        command as unknown as {
          registeredArguments: Array<{ name(): string; required: boolean }>;
        }
      ).registeredArguments;
      return args.filter((arg) => arg.required).map((arg) => arg.name());
    }

    expect(required(requireCommand('pr', 'view'))).toEqual(['id']);
    expect(required(requireCommand('pr', 'merge'))).toEqual(['id']);
    expect(required(requireCommand('pr', 'approve'))).toEqual(['id']);
    expect(required(requireCommand('repo', 'clone'))).toEqual(['repository']);
    expect(required(requireCommand('repo', 'create'))).toEqual(['name']);
    expect(required(requireCommand('pr', 'comments', 'add'))).toEqual([
      'id',
      'message',
    ]);
    expect(required(requireCommand('pr', 'reviewers', 'add'))).toEqual([
      'id',
      'user',
    ]);
  });

  it('should declare optional positional args for pr edit/diff', () => {
    function optional(command: Command): string[] {
      const args = (
        command as unknown as {
          registeredArguments: Array<{ name(): string; required: boolean }>;
        }
      ).registeredArguments;
      return args.filter((arg) => !arg.required).map((arg) => arg.name());
    }

    expect(optional(requireCommand('pr', 'edit'))).toEqual(['id']);
    expect(optional(requireCommand('pr', 'diff'))).toEqual(['id']);
    expect(optional(requireCommand('repo', 'view'))).toEqual(['repository']);
  });
});

describe('buildCommandPath', () => {
  // Minimal Commander-shaped stub: name() + parent chain up to the root, whose
  // parent is null (matching the real `cli` program).
  const node = (name: string, parent: Command | null): Command =>
    ({ name: () => name, parent }) as unknown as Command;

  it('returns an empty string for the root program', () => {
    const root = node('bb', null);
    expect(buildCommandPath(root)).toBe('');
  });

  it('returns the name for a top-level command', () => {
    const root = node('bb', null);
    expect(buildCommandPath(node('browse', root))).toBe('browse');
  });

  it('joins the full path for a deeply nested command', () => {
    const root = node('bb', null);
    const pr = node('pr', root);
    const comments = node('comments', pr);
    expect(buildCommandPath(node('add', comments))).toBe('pr comments add');
  });
});

describe('formatUpdateNotice', () => {
  const result: VersionCheckResult = {
    currentVersion: '1.0.0',
    latestVersion: '2.0.0',
    updateAvailable: true,
  };

  it('includes both versions, the install command, and the disable hint', () => {
    const notice = formatUpdateNotice(
      result,
      'bun install -g @pilatos/bitbucket-cli',
      '─'.repeat(50)
    );

    expect(notice).toContain('2.0.0');
    expect(notice).toContain('1.0.0');
    expect(notice).toContain('bun install -g @pilatos/bitbucket-cli');
    expect(notice).toContain('bb config set skipVersionCheck true');
    expect(notice).toContain('─'.repeat(50));
  });

  it('brackets the banner with blank lines', () => {
    const lines = formatUpdateNotice(result, 'install', '---').split('\n');
    expect(lines[0]).toBe('');
    expect(lines[lines.length - 1]).toBe('');
  });

  it('uses the supplied separator (honors --no-unicode)', () => {
    const ascii = formatUpdateNotice(result, 'install', '-'.repeat(50));
    expect(ascii).toContain('-'.repeat(50));
    expect(ascii).not.toContain('─');
  });
});

describe('maybePrintUpdateNotice', () => {
  const updateResult: VersionCheckResult = {
    currentVersion: '1.0.0',
    latestVersion: '2.0.0',
    updateAvailable: true,
  };

  const stubVersionService = (
    checkForUpdate: () => Promise<VersionCheckResult | null>
  ): VersionService =>
    ({
      checkForUpdate,
      getInstallCommand: () => 'bun install -g @pilatos/bitbucket-cli',
    }) as unknown as VersionService;

  // Capture process.stderr.write and toggle isTTY, restoring both afterwards.
  async function withStderr(
    isTTY: boolean | undefined,
    fn: (writes: string[]) => Promise<void>
  ): Promise<void> {
    const writes: string[] = [];
    const originalWrite = process.stderr.write;
    const originalIsTTY = process.stderr.isTTY;
    process.stderr.write = ((chunk: string) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    // isTTY is a plain data property on the stream; assign directly.
    (process.stderr as { isTTY?: boolean }).isTTY = isTTY;
    try {
      await fn(writes);
    } finally {
      process.stderr.write = originalWrite;
      (process.stderr as { isTTY?: boolean }).isTTY = originalIsTTY;
    }
  }

  it('writes the notice when an update is available on a non-JSON TTY', async () => {
    await withStderr(true, async (writes) => {
      await maybePrintUpdateNotice(
        stubVersionService(async () => updateResult),
        { json: false }
      );
      expect(writes.length).toBe(1);
      expect(writes[0]).toContain('2.0.0');
    });
  });

  it('writes nothing in JSON mode (keeps piped stdout clean)', async () => {
    await withStderr(true, async (writes) => {
      await maybePrintUpdateNotice(
        stubVersionService(async () => updateResult),
        { json: true }
      );
      expect(writes.length).toBe(0);
    });
  });

  it('writes nothing when stderr is not a TTY', async () => {
    await withStderr(false, async (writes) => {
      await maybePrintUpdateNotice(
        stubVersionService(async () => updateResult),
        { json: false }
      );
      expect(writes.length).toBe(0);
    });
  });

  it('writes nothing when no update is available', async () => {
    await withStderr(true, async (writes) => {
      await maybePrintUpdateNotice(
        stubVersionService(async () => null),
        {
          json: false,
        }
      );
      expect(writes.length).toBe(0);
    });
  });

  it('swallows errors from the version check', async () => {
    await withStderr(true, async (writes) => {
      await maybePrintUpdateNotice(
        stubVersionService(async () => {
          throw new Error('network down');
        }),
        { json: false }
      );
      expect(writes.length).toBe(0);
    });
  });
});
