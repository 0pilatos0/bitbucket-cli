/**
 * End-to-end smoke test for the standalone executable built by
 * `scripts/compile.ts` (the release binaries). Compiles for the host target
 * and proves the parts that only break once everything is embedded: the
 * inlined package version, the jq wasm asset and shell completion.
 *
 * Opt-in via COMPILE_SMOKE=1 (CI's compile-smoke job): compiling downloads the
 * baseline Bun runtime, which a plain `bun test` must not depend on.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import pkg from '../package.json' with { type: 'json' };
import { isCompileTarget } from '../scripts/compile.js';

const REPO_ROOT = resolve(import.meta.dir, '..');
const COMPILE_TIMEOUT_MS = 120_000;
const RUN_TIMEOUT_MS = 30_000;
const WINDOWS_JQ_ATTEMPTS = 200;

const hostPlatform =
  process.platform === 'win32' ? 'windows' : process.platform;
const hostTarget = `bun-${hostPlatform}-${process.arch}`;

let tmpDir = '';
let binary = '';
let homeDir = '';

async function runBinary(
  args: string[],
  extraEnv: Record<string, string> = {}
): Promise<{ status: number; stdout: string; stderr: string }> {
  const startedAt = Date.now();
  const child = spawn(binary, args, {
    cwd: homeDir,
    env: {
      HOME: homeDir,
      USERPROFILE: homeDir,
      APPDATA: join(homeDir, 'AppData', 'Roaming'),
      CI: '1',
      NODE_ENV: 'production',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let firstOutputAtMs: number | undefined;
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    firstOutputAtMs ??= Date.now() - startedAt;
    stdout += chunk;
  });
  child.stderr.on('data', (chunk: string) => {
    firstOutputAtMs ??= Date.now() - startedAt;
    stderr += chunk;
  });

  const drained = new Promise<void>((resolve) => {
    let remaining = 2;
    const done = () => {
      if (--remaining === 0) resolve();
    };
    child.stdout.on('end', done);
    child.stderr.on('end', done);
  });

  // Wait for the process, not stdio's 'close' event. On Windows, 'close' can
  // stall even when the child has exited and written its output.
  const result = await new Promise<{
    status: number;
    timedOut: boolean;
    exitCodeAtTimeout: number | null;
  }>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      const exitCodeAtTimeout = child.exitCode;
      child.kill('SIGKILL');
      finish(1, true, exitCodeAtTimeout);
    }, RUN_TIMEOUT_MS);
    const finish = (
      status: number,
      timedOut: boolean,
      exitCodeAtTimeout: number | null = null
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ status, timedOut, exitCodeAtTimeout });
    };
    child.on('error', (error) => {
      stderr += `[smoke] spawn failed: ${error.message}\n`;
      finish(1, false);
    });
    child.on('exit', (code) => finish(code ?? 1, false));
  });

  // Give stdout and stderr a short chance to drain after 'exit' or kill.
  let drainTimer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    drained,
    new Promise<void>((resolve) => {
      drainTimer = setTimeout(resolve, 2_000);
    }),
  ]);
  clearTimeout(drainTimer);

  if (result.timedOut) {
    throw new Error(
      `CLI timed out after ${RUN_TIMEOUT_MS}ms ` +
        `(exitCode=${result.exitCodeAtTimeout}, ` +
        `firstOutputAt=${firstOutputAtMs ?? 'none'}ms).\n` +
        `--- child stdout ---\n${stdout}\n--- child stderr ---\n${stderr}`
    );
  }
  return {
    status: result.status,
    stdout,
    stderr,
  };
}

describe.skipIf(
  process.env.COMPILE_SMOKE !== '1' || !isCompileTarget(hostTarget)
)(`compiled ${hostTarget} binary`, () => {
  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'bb-compile-smoke-'));
    homeDir = join(tmpDir, 'home');
    await mkdir(homeDir, { recursive: true });
    binary = join(tmpDir, hostPlatform === 'windows' ? 'bb.exe' : 'bb');

    const build = spawnSync(
      process.execPath,
      ['scripts/compile.ts', '--target', hostTarget, '--outfile', binary],
      { cwd: REPO_ROOT, stdio: 'inherit', timeout: COMPILE_TIMEOUT_MS }
    );
    if (build.status !== 0) {
      throw new Error(`scripts/compile.ts failed with ${build.status}`);
    }
  }, COMPILE_TIMEOUT_MS);

  afterAll(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it(
    'reports the package version without a package.json on disk',
    async () => {
      const result = await runBinary(['--version']);

      expect(result.stderr).toBe('');
      expect(result.stdout.trim()).toBe(pkg.version);
      expect(result.status).toBe(0);
    },
    RUN_TIMEOUT_MS + 5_000
  );

  it(
    'runs --jq through the embedded jq wasm',
    async () => {
      const result = await runBinary([
        'config',
        'list',
        '--json',
        '--jq',
        '.configPath | type',
      ]);

      expect(result.stderr).toBe('');
      expect(result.stdout).toBe('"string"\n');
      expect(result.status).toBe(0);
    },
    RUN_TIMEOUT_MS + 5_000
  );

  it.skipIf(process.platform !== 'win32')(
    'repeatedly exits after producing jq output on Windows',
    async () => {
      for (let attempt = 1; attempt <= WINDOWS_JQ_ATTEMPTS; attempt++) {
        try {
          const result = await runBinary([
            'config',
            'list',
            '--json',
            '--jq',
            '.configPath | type',
          ]);
          expect(result).toEqual({
            status: 0,
            stdout: '"string"\n',
            stderr: '',
          });
        } catch (error) {
          throw new Error(`jq attempt ${attempt}: ${String(error)}`);
        }
      }
    },
    10 * 60_000
  );

  it('embeds the bash, zsh and fish completion templates', async () => {
    const contents = await readFile(binary, 'latin1');

    expect(contents.split('begin-{pkgname}-completion').length - 1).toBe(3);
  });

  it(
    'answers shell completion requests',
    async () => {
      const result = await runBinary(['completion', '--', 'bb', 'pr', ''], {
        COMP_CWORD: '2',
        COMP_LINE: 'bb pr ',
        COMP_POINT: '6',
        SHELL: '/bin/bash',
      });

      expect(result.status).toBe(0);
      expect(result.stdout.split(/\r?\n/)).toContain('create');
    },
    RUN_TIMEOUT_MS + 5_000
  );
});
