/**
 * End-to-end smoke test for the *built* CLI (issue #309).
 *
 * The jq runtime is bundled into dist/index.js, but jq-wasm resolves its
 * WebAssembly asset at runtime relative to the bundle location
 * (`<bundleDir>/build/jq.wasm`). Unit tests exercise jq from src/ (dev mode),
 * where jq-wasm reads the asset from its own node_modules — they cannot catch
 * a broken published bundle. This suite builds the real CLI with the
 * production build script (`scripts/build.ts`) into a temp dir, serves a mock
 * Bitbucket API over loopback, and drives `repo list --json --jq` through the
 * built binary.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const MOCK_WORKSPACE = 'smoke-ws';

let tmpDir = '';
let distDir = '';
let homeDir = '';
let wasmBackup = '';
let server: ReturnType<typeof Bun.serve> | undefined;
let requestedPaths: string[] = [];

const BUILD_TIMEOUT_MS = 60_000;
// Internal kill timer for a hung CLI. The per-test Bun timeout (passed as the
// third arg to `it`) is set larger so this timer always wins the race and can
// print the child's partial output before the test is torn down.
const RUN_TIMEOUT_MS = 60_000;
// Safety net above the internal kill timer; lets the diagnostics print.
const TEST_TIMEOUT_MS = RUN_TIMEOUT_MS + 10_000;

interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

// Load-bearing child env (do not "clean up" without re-verifying):
// - HOME / USERPROFILE / APPDATA isolate the child's config lookup to the
//   temp dir on every platform (POSIX reads ~/.config/bb, win32 reads
//   %APPDATA%\bb then %USERPROFILE%\AppData\Roaming\bb).
// - CI=1 skips the post-action npm-registry update check (version.service).
// - NODE_ENV=production makes BaseCommand.handleError set process.exitCode
//   (the parent test process runs with NODE_ENV=test, which suppresses it).
// - FORCE_COLOR=0 / NO_COLOR=1 keep output TTY-independent (chalk).
// - BB_HTTP_TIMEOUT=10000 fails a broken request fast (10s) instead of
//   hanging the run for the default 30s — a fast, readable assertion failure.
function cliEnv(): Record<string, string> {
  return {
    HOME: homeDir,
    USERPROFILE: homeDir,
    APPDATA: join(homeDir, 'AppData', 'Roaming'),
    BB_API_BASE_URL: `http://127.0.0.1:${server!.port}/2.0`,
    BB_HTTP_TIMEOUT: '10000',
    CI: '1',
    NODE_ENV: 'production',
    FORCE_COLOR: '0',
    NO_COLOR: '1',
  };
}

/**
 * Run the built CLI as a child process. Must be async: the mock server lives
 * in this test process, so a blocking spawnSync would starve the event loop
 * and the CLI's request could never be served (deadlock).
 *
 * Completion is signaled by the 'exit' event, not 'close': on Windows,
 * 'close' (which waits for stdio EOF) can stall forever even after the child
 * has exited and fully written its output (observed on CI, issue #309).
 * 'exit' fires on the process handle alone, which libuv reaps reliably. The
 * captured output is drained with a short grace after 'exit'; a stalled
 * stdout tail surfaces in the timeout diagnostics.
 */
async function runCli(args: string[]): Promise<CliResult> {
  const child = spawn(process.execPath, [join(distDir, 'index.js'), ...args], {
    cwd: homeDir,
    env: cliEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => (stdout += chunk));
  child.stderr.on('data', (chunk: string) => (stderr += chunk));

  const drained = new Promise<void>((resolve) => {
    let remaining = 2;
    const done = () => {
      remaining -= 1;
      if (remaining === 0) resolve();
    };
    child.stdout.on('end', done);
    child.stderr.on('end', done);
  });

  const { status, timedOut } = await new Promise<{
    status: number;
    timedOut: boolean;
  }>((resolve) => {
    let settled = false;
    const finish = (status: number, timedOut: boolean) => {
      if (!settled) {
        settled = true;
        resolve({ status, timedOut });
      }
    };
    child.on('error', (error) => {
      stderr += `[smoke] spawn failed: ${error.message}\n`;
      finish(1, false);
    });
    child.on('exit', (code) => finish(code ?? 1, false));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(1, true);
    }, RUN_TIMEOUT_MS);
    timer.unref();
  });

  if (timedOut) {
    // exitCode === null means 'exit' never fired — the child itself hung
    // rather than a stalled pipe.
    console.error(
      `[smoke] CLI timed out after ${RUN_TIMEOUT_MS}ms ` +
        `(child.exitCode=${child.exitCode}, signalCode=${child.signalCode}).\n` +
        `--- child stdout ---\n${stdout}\n--- child stderr ---\n${stderr}`
    );
  }

  // 'exit' fires before stdio closes; give the stream tails a moment to
  // drain, then move on with whatever was captured.
  await Promise.race([
    drained,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  return { status, stdout, stderr };
}

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'bb-dist-smoke-'));
  distDir = join(tmpDir, 'dist');
  homeDir = join(tmpDir, 'home');
  await mkdir(homeDir, { recursive: true, mode: 0o700 });

  const build = spawnSync(
    process.execPath,
    ['scripts/build.ts', '--outdir', distDir],
    { cwd: REPO_ROOT, stdio: 'inherit', timeout: BUILD_TIMEOUT_MS }
  );
  if (build.status !== 0) {
    throw new Error(`scripts/build.ts failed with exit code ${build.status}`);
  }

  // The bundle resolves its own package.json via createRequire(import.meta.url)
  // (`../package.json` relative to dist/) for the version string.
  await writeFile(
    join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'smoke', version: '0.0.0', type: 'module' })
  );

  // Write the config in BOTH platform layouts so whichever leg CI runs on
  // finds the credentials: POSIX reads $HOME/.config/bb, win32 reads
  // %APPDATA%\bb first, then %USERPROFILE%\AppData\Roaming\bb. Modes are
  // no-ops on Windows but keep the POSIX permission guard satisfied.
  const configs = [
    {
      dir: join(homeDir, '.config', 'bb'),
      file: join(homeDir, '.config', 'bb', 'config.json'),
    },
    {
      dir: join(homeDir, 'AppData', 'Roaming', 'bb'),
      file: join(homeDir, 'AppData', 'Roaming', 'bb', 'config.json'),
    },
  ];
  for (const { dir, file } of configs) {
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(
      file,
      JSON.stringify({ username: 'smoke-user', apiToken: 'smoke-token' }),
      { mode: 0o600 }
    );
  }

  // Keep a copy of the staged wasm so the missing-wasm test can restore it
  // and the suite stays independent of test order.
  wasmBackup = join(tmpDir, 'jq.wasm.backup');
  await cp(join(distDir, 'build', 'jq.wasm'), wasmBackup);

  server = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      requestedPaths.push(url.pathname);
      if (url.pathname === `/2.0/repositories/${MOCK_WORKSPACE}`) {
        return Response.json({
          values: [
            {
              type: 'repository',
              uuid: '{repo-uuid}',
              full_name: `${MOCK_WORKSPACE}/alpha`,
              name: 'alpha',
              slug: 'alpha',
              is_private: false,
              description: 'Mock repo',
              links: { html: { href: 'https://example.invalid/alpha' } },
            },
          ],
          pagelen: 10,
          size: 1,
          page: 1,
        });
      }
      return Response.json(
        {
          type: 'error',
          error: { message: `unexpected path: ${url.pathname}` },
        },
        { status: 404 }
      );
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

describe('built dist --jq (issue #309)', () => {
  it(
    'runs jq through the bundled CLI with the staged wasm',
    async () => {
      const result = await runCli([
        'repo',
        'list',
        '--json',
        '--jq',
        '.repositories[0].name',
        '--workspace',
        MOCK_WORKSPACE,
      ]);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      // jq emits strings JSON-encoded, so the name comes out quoted.
      expect(result.stdout).toBe('"alpha"\n');
      expect(requestedPaths).toContain(`/2.0/repositories/${MOCK_WORKSPACE}`);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'fails loudly when the wasm is not staged next to the bundle',
    async () => {
      await rm(join(distDir, 'build'), { recursive: true, force: true });
      try {
        const result = await runCli([
          'repo',
          'list',
          '--json',
          '--jq',
          '.repositories[0].name',
          '--workspace',
          MOCK_WORKSPACE,
        ]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          'jq-wasm: could not read the wasm asset'
        );
      } finally {
        await mkdir(join(distDir, 'build'), { recursive: true });
        await cp(wasmBackup, join(distDir, 'build', 'jq.wasm'));
      }
    },
    TEST_TIMEOUT_MS
  );
});
