/**
 * CLI helper tests
 */

import { describe, it, expect } from 'bun:test';
import { resolveNoColorSetting, withGlobalOptions } from '../src/cli.js';
import { cli } from '../src/cli.js';
import type { CommandContext } from '../src/core/interfaces/commands.js';

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
  return output;
}

describe('CLI help text integration', () => {
  it('should include environment variables in root help', () => {
    const output = captureHelp(cli);

    expect(output).toContain('Environment variables:');
    expect(output).toContain('BB_USERNAME');
    expect(output).toContain('BB_API_TOKEN');
    expect(output).toContain('NO_COLOR');
    expect(output).toContain('FORCE_COLOR');
    expect(output).toContain('DEBUG');
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
  });
});
