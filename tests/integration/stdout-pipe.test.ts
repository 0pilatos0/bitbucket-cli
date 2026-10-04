/**
 * Output larger than the pipe buffer (64 KB on macOS and Linux) must reach a
 * piped reader in full. Bun's console.log stops at whatever fits in the pipe
 * and drops the rest once `process.stdout` has been touched, which turned
 * `bb pr list --json | jq` into invalid JSON with exit 0. Runs the real
 * entrypoint out of process because the failure only exists on a real pipe.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..', '..');
const REPO_COUNT = 2000;

let homeDir = '';
let server: ReturnType<typeof Bun.serve> | undefined;

beforeAll(async () => {
  homeDir = await mkdtemp(join(tmpdir(), 'bb-stdout-pipe-'));
  const configDir = join(homeDir, '.config', 'bb');
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({ username: 'tester', apiToken: 'test-token' }),
    { mode: 0o600 }
  );

  const values = Array.from({ length: REPO_COUNT }, (_, index) => ({
    type: 'repository',
    full_name: `ws/repo-${index}`,
    is_private: index % 2 === 0,
    description: `Repository number ${index}`,
  }));
  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch() {
      return Response.json({
        values,
        size: REPO_COUNT,
        page: 1,
        pagelen: REPO_COUNT,
      });
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  if (homeDir) {
    await rm(homeDir, { recursive: true, force: true });
  }
});

/**
 * Pipes the CLI into a reader that waits before draining. Goes through `sh`
 * because Node and Bun hand a spawned child a socketpair on macOS, whose
 * larger buffer hides the bug; only a real `|` pipe reproduces it.
 */
async function runIntoSlowPipe(
  args: string[]
): Promise<{ status: string; stdout: string; stderr: string }> {
  const statusFile = join(homeDir, 'status');
  const child = spawn(
    'sh',
    [
      '-c',
      '{ "$@"; echo $? > "$BB_TEST_STATUS_FILE"; } | { sleep 0.3; cat; }',
      'bb-pipe',
      process.execPath,
      join(REPO_ROOT, 'src', 'index.ts'),
      ...args,
    ],
    {
      cwd: homeDir,
      env: {
        PATH: process.env.PATH ?? '',
        HOME: homeDir,
        BB_API_BASE_URL: `http://127.0.0.1:${server!.port}/2.0`,
        BB_HTTP_TIMEOUT: '10000',
        BB_TEST_STATUS_FILE: statusFile,
        CI: '1',
        NODE_ENV: 'production',
        NO_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => (stdout += chunk));
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => (stderr += chunk));

  await new Promise<void>((done) => child.on('close', () => done()));
  const status = (await readFile(statusFile, 'utf8')).trim();
  return { status, stdout, stderr };
}

describe('output larger than the pipe buffer', () => {
  it.skipIf(process.platform === 'win32')(
    'delivers complete, parseable --json output',
    async () => {
      const result = await runIntoSlowPipe([
        'repo',
        'list',
        '--workspace',
        'ws',
        '--all',
        '--json',
      ]);

      expect(result.stderr).toBe('');
      expect(result.status).toBe('0');
      expect(result.stdout.length).toBeGreaterThan(64 * 1024);
      const parsed = JSON.parse(result.stdout) as {
        repositories: unknown[];
      };
      expect(parsed.repositories).toHaveLength(REPO_COUNT);
    },
    30_000
  );

  it.skipIf(process.platform === 'win32')(
    'delivers every table row',
    async () => {
      const result = await runIntoSlowPipe([
        'repo',
        'list',
        '--workspace',
        'ws',
        '--all',
      ]);

      expect(result.stderr).toBe('');
      expect(result.status).toBe('0');
      expect(result.stdout.length).toBeGreaterThan(64 * 1024);
      const rows = result.stdout.trimEnd().split('\n');
      expect(rows).toHaveLength(REPO_COUNT);
      expect(rows.at(-1)).toStartWith(`ws/repo-${REPO_COUNT - 1}\t`);
    },
    30_000
  );
});
