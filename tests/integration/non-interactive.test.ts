/**
 * Runs the real entrypoint with piped stdio, the way scripts and agents do:
 * nothing may block on a human, open a browser, or change server state under
 * `--dry-run`.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..', '..');

let homeDir = '';
let emptyHomeDir = '';
let server: ReturnType<typeof Bun.serve> | undefined;
const requests: string[] = [];

beforeAll(async () => {
  homeDir = await mkdtemp(join(tmpdir(), 'bb-non-interactive-'));
  emptyHomeDir = await mkdtemp(join(tmpdir(), 'bb-non-interactive-empty-'));
  const configDir = join(homeDir, '.config', 'bb');
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({ username: 'tester', apiToken: 'test-token' }),
    { mode: 0o600 }
  );

  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      requests.push(`${request.method} ${url.pathname}`);
      return Response.json({ type: 'repository', slug: 'repo' });
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  for (const dir of [homeDir, emptyHomeDir]) {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

async function runCli(
  args: string[],
  home = homeDir
): Promise<{ status: number; stdout: string; stderr: string }> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: home,
    BB_API_BASE_URL: `http://127.0.0.1:${server!.port}/2.0`,
    BB_HTTP_TIMEOUT: '10000',
    CI: '1',
    NODE_ENV: 'production',
    NO_COLOR: '1',
  };
  if (process.platform === 'win32') {
    env.APPDATA = join(home, 'AppData', 'Roaming');
    env.USERPROFILE = home;
  }
  const child = Bun.spawn(
    [process.execPath, join(REPO_ROOT, 'src', 'index.ts'), ...args],
    { cwd: home, env, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' }
  );
  const [stdout, stderr, status] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { status, stdout, stderr };
}

describe('non-interactive safety', () => {
  it('auth login fails fast with AUTH_REQUIRED instead of opening a browser', async () => {
    const started = performance.now();
    const result = await runCli(['auth', 'login', '--json'], emptyHomeDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr)).toMatchObject({
      code: 1001,
      message: expect.stringContaining('BB_API_TOKEN'),
    });
    expect(performance.now() - started).toBeLessThan(10_000);
  }, 20_000);

  it('browse prints the URL when stdout is not a terminal', async () => {
    const result = await runCli([
      'browse',
      '--pr',
      '7',
      '--workspace',
      'ws',
      '--repo',
      'repo',
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      'https://bitbucket.org/ws/repo/pull-requests/7'
    );
  }, 20_000);

  it('pr decline --dry-run prints the request and sends nothing', async () => {
    requests.length = 0;
    const result = await runCli([
      'pr',
      'decline',
      '7',
      '--dry-run',
      '--json',
      '--workspace',
      'ws',
      '--repo',
      'repo',
    ]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      dryRun: true,
      request: {
        method: 'POST',
        url: `http://127.0.0.1:${server!.port}/2.0/repositories/ws/repo/pullrequests/7/decline`,
      },
    });
    expect(requests).toEqual([]);
  }, 20_000);

  it('repo delete --dry-run skips the --yes gate and sends no write', async () => {
    requests.length = 0;
    const result = await runCli([
      'repo',
      'delete',
      'ws/repo',
      '--dry-run',
      '--workspace',
      'ws',
    ]);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Dry run: this request was not sent.');
    expect(result.stdout).toContain(
      `DELETE http://127.0.0.1:${server!.port}/2.0/repositories/ws/repo`
    );
    expect(requests.filter((r) => !r.startsWith('GET '))).toEqual([]);
  }, 20_000);
});
