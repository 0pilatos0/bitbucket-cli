/**
 * Root-level parse behaviour: unknown commands, `bb help <command>`, and the
 * `--json`-before-subcommand trap.
 *
 * These live in their own file on purpose. `cli.parseAsync()` mutates the
 * module-level `cli` singleton (`cli.args`, `cli.opts()`), and
 * tests/cli.test.ts already reconfigures that same instance via
 * `configureOutput()` without restoring it — so keeping parse-driven cases
 * apart limits the bleed.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'bun:test';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import { cli } from '../src/cli.js';
import { ErrorCode } from '../src/types/errors.js';

const originalCI = process.env.CI;

let stderr: string[] = [];
let stdout: string[] = [];
const originalConsoleError = console.error;

beforeAll(() => {
  // `maybePrintUpdateNotice` only short-circuits on a NON-TTY stderr, which is
  // false under an interactive `bun test` — without this the postAction hook
  // would reach `checkForUpdate()` and hit the npm registry.
  process.env.CI = 'true';
});

afterAll(() => {
  if (originalCI === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = originalCI;
  }
  console.error = originalConsoleError;
});

// Cases here deliberately set process.exitCode = 1 in-process. Reset after each
// one, or appending an error-path case at the end of this file would make the
// whole `bun test` run exit non-zero.
afterEach(() => {
  process.exitCode = 0;
});

beforeEach(() => {
  stderr = [];
  stdout = [];
  // This file deliberately does not import tests/setup.ts (it needs the real
  // container the root action resolves from), so its global exit-code reset
  // does not apply here — do it ourselves or a failing case leaks into the
  // next one's assertion.
  process.exitCode = 0;
  console.error = (...args: unknown[]) => {
    stderr.push(args.map(String).join(' '));
  };
  // `outputHelp()` writes through the OWN output configuration of whichever
  // command is printing, and children get theirs at creation time — so
  // configuring only the root would let `bb help pr` escape to real stdout.
  captureTree(cli);
});

function captureTree(command: Command): void {
  command.configureOutput({
    writeOut: (str: string) => {
      stdout.push(str);
    },
    writeErr: (str: string) => {
      stderr.push(str);
    },
  });
  for (const child of command.commands) {
    captureTree(child);
  }
}

/** Run the real root parser over `argv` and collect what the user would see. */
async function run(argv: string[]): Promise<{
  stderr: string;
  stdout: string;
  exitCode: typeof process.exitCode;
}> {
  await cli.parseAsync(argv, { from: 'user' });
  // Read before this file's own afterEach resets it.
  return {
    stderr: stderr.join('\n'),
    stdout: stdout.join(''),
    exitCode: process.exitCode,
  };
}

describe('unknown top-level command', () => {
  it('suggests the closest group and exits 1', async () => {
    const result = await run(['prr']);

    expect(result.stderr).toContain("unknown command 'prr'");
    expect(result.stderr).toContain('(Did you mean pr?)');
    expect(result.exitCode).toBe(1);
  });

  it('suggests a group even when subcommand args follow', async () => {
    const result = await run(['repoo', 'list']);

    expect(result.stderr).toContain("unknown command 'repoo'");
    expect(result.stderr).toContain('(Did you mean repo?)');
    expect(result.exitCode).toBe(1);
  });

  it('points at --help when nothing is close enough', async () => {
    const result = await run(['zzzzzzzzzz']);

    expect(result.stderr).toContain("unknown command 'zzzzzzzzzz'");
    expect(result.stderr).toContain(
      'Run `bb --help` to see available commands.'
    );
    expect(result.stderr).not.toContain('(Did you mean');
    expect(result.exitCode).toBe(1);
  });

  it('emits a JSON envelope when --json follows the bad command', async () => {
    const result = await run(['prr', '--json']);

    const payload = JSON.parse(result.stderr) as Record<string, unknown>;
    expect(payload.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(payload.name).toBe('BBError');
    expect(payload.message).toContain('(Did you mean pr?)');
    expect(payload.context).toEqual({ command: 'prr' });
    expect(result.exitCode).toBe(1);
  });
});

describe('--json before the subcommand', () => {
  it('explains that --json swallowed the group name', async () => {
    // `--json [fields]` takes an optional value, so it consumes `pr` and
    // leaves `list` looking like a top-level command.
    const result = await run(['--json', 'pr', 'list']);

    const payload = JSON.parse(result.stderr) as Record<string, string>;
    expect(payload.message).toContain("--json consumed 'pr' as its field list");
    expect(payload.message).toContain(
      'Put --json after the subcommand: bb pr list --json'
    );
    expect(result.exitCode).toBe(1);
  });

  it('handles a lone group name with nothing left over', async () => {
    const result = await run(['--json', 'pr']);

    const payload = JSON.parse(result.stderr) as Record<string, string>;
    expect(payload.message).toContain(
      'Put --json after the subcommand: bb pr --json'
    );
    expect(result.exitCode).toBe(1);
  });

  it('blames the misspelled token, not the correct one', async () => {
    const result = await run(['--json', 'prr', 'list']);

    const payload = JSON.parse(result.stderr) as Record<string, string>;
    expect(payload.message).toContain("unknown command 'prr'");
    expect(payload.message).toContain('(Did you mean pr?)');
    expect(result.exitCode).toBe(1);
  });

  it('leaves a genuine field list alone', async () => {
    // KNOWN LIMITATION, pinned deliberately: `--json <typo>` with no further
    // token is indistinguishable from a real field list, so it still prints
    // root help and exits 0. Never write an acceptance test with --json before
    // the subcommand and no third token expecting an error — verify new cases
    // with the flag in BOTH positions.
    const result = await run(['--json', 'prr']);

    expect(result.stdout).toContain('Usage: bb');
    expect(result.exitCode).toBeFalsy();
  });
});

describe('bb help <command>', () => {
  it('prints help for a top-level group', async () => {
    const result = await run(['help', 'pr']);

    expect(result.stdout).toContain('Usage: bb pr');
    expect(result.stdout).toContain('Manage pull requests');
    expect(result.exitCode).toBeFalsy();
  });

  it('prints help for a nested group', async () => {
    const result = await run(['help', 'pr', 'comments']);

    expect(result.stdout).toContain('Usage: bb pr comments');
    expect(result.exitCode).toBeFalsy();
  });

  it('prints root help for bare `bb help`', async () => {
    const result = await run(['help']);

    expect(result.stdout).toContain('Usage: bb');
    expect(result.exitCode).toBeFalsy();
  });

  it('reports an unresolvable help target as an unknown command', async () => {
    const result = await run(['help', 'zzz']);

    expect(result.stderr).toContain("unknown command 'zzz'");
    expect(result.exitCode).toBe(1);
  });

  it('is advertised in root help, since Commander cannot list it', async () => {
    const result = await run([]);

    expect(result.stdout).toContain('bb help pr');
    expect(result.exitCode).toBeFalsy();
  });
});

describe('bare bb', () => {
  it('still prints help and exits 0', async () => {
    const result = await run([]);

    expect(result.stdout).toContain('Usage: bb');
    expect(result.stdout).toContain('Environment variables:');
    expect(result.exitCode).toBeFalsy();
  });
});

describe('allowExcessArguments placement', () => {
  it('applies to the root only, so subcommand arity checks survive', () => {
    // `copyInheritedSettings()` would propagate this to commands created with
    // `.command()` if it were called before the tree was built, silently
    // disabling arity checking on `browse`/`api`. Reaching into a Commander
    // private is precedented elsewhere in the suite.
    expect(
      (cli as unknown as { _allowExcessArguments: boolean })
        ._allowExcessArguments
    ).toBe(true);

    for (const name of ['browse', 'api', 'pr', 'auth']) {
      const command = cli.commands.find((c) => c.name() === name);
      expect(command).toBeDefined();
      expect(
        (command as unknown as { _allowExcessArguments: boolean })
          ._allowExcessArguments
      ).toBeFalsy();
    }
  });

  it('still rejects too many arguments for a subcommand', async () => {
    // Must run out-of-process: Commander's own error path calls
    // `process.exit()` (we never install `exitOverride()`), which would kill
    // the test runner if driven through `cli.parseAsync` here.
    // `fileURLToPath`, not `URL.pathname`: on Windows the latter yields
    // `/C:/...`, which is not a valid cwd.
    const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'browse', 'x', 'y'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, CI: 'true' },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [exitCode, errorOutput] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);

    expect(errorOutput).toContain('too many arguments');
    expect(exitCode).toBe(1);
  });
});
