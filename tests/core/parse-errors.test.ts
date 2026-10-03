import { describe, it, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import {
  argvRequestsJson,
  installParseErrorHandling,
} from '../../src/core/parse-errors.js';
import { ErrorCode } from '../../src/types/errors.js';

class ExitSignal extends Error {
  constructor(public readonly code: number) {
    super(`exit ${code}`);
  }
}

/**
 * A miniature `bb` tree: a group attached with `addCommand()` (which does not
 * inherit Commander settings) holding a leaf with a required argument.
 */
function harness(argv: string[]) {
  const root = new Command('bb').option('--json [fields]');
  const group = new Command('pr');
  group
    .command('view')
    .argument('<id>')
    .action(() => {});
  root.addCommand(group);

  const stderr: string[] = [];
  const payloads: Record<string, unknown>[] = [];
  root.configureOutput({ writeErr: (str) => stderr.push(str) });
  group.configureOutput({ writeErr: (str) => stderr.push(str) });
  installParseErrorHandling(root, {
    argv: () => argv,
    writeJsonError: (payload) => payloads.push(payload),
    exit: (code) => {
      throw new ExitSignal(code);
    },
  });

  const parse = async (): Promise<number> => {
    try {
      await root.parseAsync(argv, { from: 'user' });
      return 0;
    } catch (error) {
      if (error instanceof ExitSignal) return error.code;
      throw error;
    }
  };
  return { parse, stderr, payloads };
}

describe('argvRequestsJson', () => {
  it('detects --json with or without a value', () => {
    expect(argvRequestsJson(['pr', 'list', '--json'])).toBe(true);
    expect(argvRequestsJson(['pr', 'list', '--json=id'])).toBe(true);
    expect(argvRequestsJson(['pr', 'list'])).toBe(false);
  });

  it('treats --jq as a request for machine output', () => {
    expect(argvRequestsJson(['pr', 'list', '--jq', '.count'])).toBe(true);
    expect(argvRequestsJson(['pr', 'list', '--jq=.count'])).toBe(true);
    expect(argvRequestsJson(['pr', 'list', '--jsonx'])).toBe(false);
  });

  it('ignores --json after the -- separator', () => {
    expect(argvRequestsJson(['api', '--', '--json'])).toBe(false);
  });
});

describe('installParseErrorHandling', () => {
  it('emits a JSON envelope for a nested unknown option with --json', async () => {
    const { parse, stderr, payloads } = harness([
      'pr',
      'view',
      '1',
      '--bogus',
      '--json',
    ]);

    expect(await parse()).toBe(1);
    expect(stderr).toEqual([]);
    expect(payloads).toEqual([
      {
        name: 'BBError',
        code: ErrorCode.VALIDATION_INVALID,
        message: "unknown option '--bogus'",
        context: { parseError: 'unknownOption', commandPath: 'pr view' },
        hint: 'Run `bb pr view --help` for usage.',
      },
    ]);
  });

  it('reports a missing argument as VALIDATION_REQUIRED', async () => {
    const { parse, payloads } = harness(['pr', 'view', '--json']);

    expect(await parse()).toBe(1);
    expect(payloads[0]).toMatchObject({
      code: ErrorCode.VALIDATION_REQUIRED,
      context: { parseError: 'missingArgument' },
    });
  });

  it("keeps Commander's text output without --json", async () => {
    const { parse, stderr, payloads } = harness(['pr', 'lsit']);

    expect(await parse()).toBe(1);
    expect(payloads).toEqual([]);
    expect(stderr.join('')).toContain("error: unknown command 'lsit'");
  });

  it('reports a group run without a subcommand instead of printing help', async () => {
    const { parse, stderr, payloads } = harness(['pr', '--json']);

    expect(await parse()).toBe(1);
    expect(stderr).toEqual([]);
    expect(payloads).toEqual([
      {
        name: 'BBError',
        code: ErrorCode.VALIDATION_REQUIRED,
        message: "missing subcommand for 'pr'",
        context: { parseError: 'missingSubcommand', commandPath: 'pr' },
        hint: 'Run `bb pr --help` for usage.',
      },
    ]);
  });

  it('exits 0 for --help', async () => {
    const { parse, payloads } = harness(['pr', 'view', '--help']);

    expect(await parse()).toBe(0);
    expect(payloads).toEqual([]);
  });
});

describe('real CLI', () => {
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

  async function runCli(
    args: string[],
    env: Record<string, string> = {}
  ): Promise<{ exitCode: number; stderr: string }> {
    const home = mkdtempSync(join(tmpdir(), 'bb-parse-errors-'));
    const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CI: 'true',
        // bun test sets NODE_ENV=test, which makes handleError skip exit codes.
        NODE_ENV: 'production',
        HOME: home,
        XDG_CONFIG_HOME: join(home, '.config'),
        APPDATA: join(home, 'AppData'),
        BB_DETAILED_EXIT_CODES: '',
        ...env,
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [exitCode, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);
    return { exitCode, stderr };
  }

  it('renders a subcommand parse error as JSON and exits 1 by default', async () => {
    const { exitCode, stderr } = await runCli(['pr', 'lsit', '--json']);

    expect(JSON.parse(stderr)).toMatchObject({
      code: ErrorCode.VALIDATION_INVALID,
      context: { parseError: 'unknownCommand', commandPath: 'pr' },
    });
    expect(exitCode).toBe(1);
  });

  it('exits 2 for a parse error with BB_DETAILED_EXIT_CODES', async () => {
    const { exitCode } = await runCli(['pr', 'list', '--bogus'], {
      BB_DETAILED_EXIT_CODES: '1',
    });

    expect(exitCode).toBe(2);
  });

  it('renders --jq without --json as a JSON envelope', async () => {
    const { exitCode, stderr } = await runCli(['pr', 'list', '--jq', '.'], {
      BB_DETAILED_EXIT_CODES: '1',
    });

    expect(JSON.parse(stderr)).toMatchObject({
      code: ErrorCode.JSON_FORMAT_INVALID,
      message: '--jq requires --json',
    });
    expect(exitCode).toBe(2);
  });

  it('reports CONFIRMATION_REQUIRED with the retry command and exits 5', async () => {
    const { exitCode, stderr } = await runCli(
      ['repo', 'delete', 'acme/site', '--json'],
      { BB_DETAILED_EXIT_CODES: '1' }
    );

    expect(JSON.parse(stderr)).toEqual({
      name: 'BBError',
      code: ErrorCode.CONFIRMATION_REQUIRED,
      message: 'This will permanently delete acme/site.\nUse --yes to confirm.',
      context: { retry: 'bb repo delete acme/site --json --yes' },
    });
    expect(exitCode).toBe(5);
  });
});
