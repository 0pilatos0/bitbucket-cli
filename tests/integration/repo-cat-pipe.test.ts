/**
 * `bb repo cat big.bin | head -c 1`: the reader closes the pipe after the
 * first chunk, so the CLI's next write fails with EPIPE. That must end the
 * run quietly instead of crashing with a Bun error report. Runs the real
 * entrypoint out of process because the failure only exists on a real pipe.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..', '..');
const FILE_SIZE = 8 * 1024 * 1024;

let homeDir = '';
let server: ReturnType<typeof Bun.serve> | undefined;

beforeAll(async () => {
  homeDir = await mkdtemp(join(tmpdir(), 'bb-cat-pipe-'));
  const configDir = join(homeDir, '.config', 'bb');
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({ username: 'tester', apiToken: 'test-token' }),
    { mode: 0o600 }
  );

  const content = new Uint8Array(FILE_SIZE).fill(0x61);
  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      if (url.searchParams.get('format') === 'meta') {
        return Response.json({
          type: 'commit_file',
          path: 'big.bin',
          size: FILE_SIZE,
          commit: { hash: 'abc123' },
        });
      }
      return new Response(content);
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  if (homeDir) {
    await rm(homeDir, { recursive: true, force: true });
  }
});

describe('repo cat into a pipe that closes early', () => {
  it.skipIf(process.platform === 'win32')(
    'exits 0 with nothing on stderr',
    async () => {
      const child = spawn(
        process.execPath,
        [
          join(REPO_ROOT, 'src', 'index.ts'),
          'repo',
          'cat',
          'big.bin',
          '--workspace',
          'ws',
          '--repo',
          'repo',
        ],
        {
          cwd: homeDir,
          env: {
            PATH: process.env.PATH ?? '',
            HOME: homeDir,
            BB_API_BASE_URL: `http://127.0.0.1:${server!.port}/2.0`,
            BB_HTTP_TIMEOUT: '10000',
            CI: '1',
            NODE_ENV: 'production',
            NO_COLOR: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      let stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => (stderr += chunk));
      child.stdout.once('data', () => child.stdout.destroy());

      const status = await new Promise<number | null>((done) =>
        child.on('exit', (code) => done(code))
      );

      expect(stderr).toBe('');
      expect(status).toBe(0);
    },
    30_000
  );
});
