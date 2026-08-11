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
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const MOCK_WORKSPACE = 'smoke-ws';

let tmpDir: string;
let distDir: string;
let homeDir: string;
let server: ReturnType<typeof Bun.serve> | undefined;
let requestedPaths: string[] = [];

const BUILD_TIMEOUT_MS = 60_000;
const RUN_TIMEOUT_MS = 60_000;

interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

/**
 * Run the built CLI as a child process. Must be async: the mock server lives
 * in this test process, so a blocking spawnSync would starve the event loop
 * and the CLI's request could never be served (deadlock).
 */
async function runCli(args: string[]): Promise<CliResult> {
  const child = spawn(process.execPath, [join(distDir, 'index.js'), ...args], {
    cwd: homeDir,
    env: {
      HOME: homeDir,
      USERPROFILE: homeDir,
      BB_API_BASE_URL: `http://127.0.0.1:${server!.port}/2.0`,
      CI: '1',
      NODE_ENV: 'production',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => (stdout += chunk));
  child.stderr.on('data', (chunk: string) => (stderr += chunk));

  const status = await new Promise<number>((resolve) => {
    let settled = false;
    const finish = (code: number) => {
      if (!settled) {
        settled = true;
        resolve(code);
      }
    };
    child.on('exit', (code) => finish(code ?? 1));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(1);
    }, RUN_TIMEOUT_MS);
    timer.unref();
  });

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

  // Config path is $HOME/.config/bb/config.json (platform-aware; USERPROFILE
  // covers the Windows leg). Write it directly with the same permissions the
  // CLI enforces so the permission guard is satisfied.
  const configDir = join(homeDir, '.config', 'bb');
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({ username: 'smoke-user', apiToken: 'smoke-token' }),
    { mode: 0o600 }
  );

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

  homeDir = join(tmpDir, 'home');
  await mkdir(homeDir, { recursive: true, mode: 0o700 });
});

afterAll(async () => {
  server?.stop(true);
  await rm(tmpDir, { recursive: true, force: true });
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
    RUN_TIMEOUT_MS
  );

  it(
    'fails loudly when the wasm is not staged next to the bundle',
    async () => {
      await rm(join(distDir, 'build'), { recursive: true, force: true });

      const result = await runCli([
        'repo',
        'list',
        '--json',
        '--jq',
        '.repositories[0].name',
        '--workspace',
        MOCK_WORKSPACE,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('jq-wasm: could not read the wasm asset');
    },
    RUN_TIMEOUT_MS
  );
});
