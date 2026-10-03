/**
 * Runs scripts/install.sh and scripts/install.ps1 against a fake release served
 * over loopback: one release with archives and one older release that only
 * ships raw binaries.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { assetName, type CompileTarget } from '../scripts/compile.js';
import { archiveName } from '../scripts/package-release.js';

const SCRIPTS_DIR = resolve(import.meta.dir, '..', 'scripts');
const isWindows = process.platform === 'win32';
const hostTarget = `bun-${process.platform}-${process.arch}` as CompileTarget;
const hostAsset = assetName(hostTarget);
const hostArchive = archiveName(hostTarget);
const FAKE_BB = '#!/bin/sh\necho fake-bb\n';

let tmpDir = '';
let releasesDir = '';
let server: ReturnType<typeof Bun.serve> | undefined;

function sha256(data: string | Uint8Array): string {
  return new Bun.CryptoHasher('sha256').update(data).digest('hex');
}

function run(command: string, args: string[], cwd?: string): void {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr}`);
  }
}

/** Writes `files` plus a SHA256SUMS over them into a release download dir. */
async function writeRelease(
  path: string,
  files: Record<string, string | Uint8Array>,
  sums: Record<string, string | Uint8Array> = files
): Promise<void> {
  const dir = join(releasesDir, path);
  await mkdir(dir, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    await writeFile(join(dir, name), data);
  }
  const lines = Object.entries(sums).map(
    ([name, data]) => `${sha256(data)}  ${name}\n`
  );
  await writeFile(join(dir, 'SHA256SUMS'), lines.join(''));
}

/** Builds an archive holding `name` with `content`, the way releases do. */
async function makeArchive(
  name: string,
  content: string,
  format: 'tar.gz' | 'zip'
): Promise<Uint8Array> {
  const stage = await mkdtemp(join(tmpDir, 'stage-'));
  await writeFile(join(stage, name), content, { mode: 0o755 });
  await writeFile(join(stage, 'LICENSE'), 'MIT');
  const out = join(stage, `archive.${format}`);
  // bsdtar (macOS, Windows) writes zip with -a; GNU tar has no zip support.
  if (format === 'zip' && !isWindows) {
    run('zip', ['-q', out, name, 'LICENSE'], stage);
  } else {
    run(
      'tar',
      [format === 'zip' ? '-acf' : '-czf', out, name, 'LICENSE'],
      stage
    );
  }
  return new Uint8Array(await readFile(out));
}

// Async, so the in-process server keeps answering while the script runs.
async function runScript(
  command: string,
  args: string[],
  env: Record<string, string | undefined>
): Promise<{ status: number; stdout: string; stderr: string }> {
  const child = Bun.spawn([command, ...args], {
    env,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, status] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { status, stdout, stderr };
}

function releasesUrl(): string {
  return `http://127.0.0.1:${server!.port}/releases`;
}

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'bb-install-'));
  releasesDir = join(tmpDir, 'releases');
  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const path = decodeURIComponent(new URL(req.url).pathname);
      const file = Bun.file(join(tmpDir, path));
      return (await file.exists())
        ? new Response(file)
        : new Response('not found', { status: 404 });
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  await rm(tmpDir, { recursive: true, force: true });
});

describe.skipIf(isWindows)('install.sh', () => {
  beforeAll(async () => {
    const archive = await makeArchive('bb', FAKE_BB, 'tar.gz');
    await writeRelease('latest/download', {
      [hostAsset]: 'raw binary, not used when an archive exists',
      [hostArchive]: archive,
    });
    await writeRelease('download/v1.0.0', { [hostAsset]: FAKE_BB });
    await writeRelease(
      'download/v1.0.1',
      { [hostArchive]: archive },
      { [hostArchive]: 'tampered' }
    );
  });

  async function install(
    env: Record<string, string> = {},
    installDir?: string
  ) {
    installDir ??= await mkdtemp(join(tmpDir, 'bin-'));
    const result = await runScript('sh', [join(SCRIPTS_DIR, 'install.sh')], {
      PATH: process.env.PATH,
      HOME: tmpDir,
      BB_RELEASES_URL: releasesUrl(),
      BB_INSTALL_DIR: installDir,
      ...env,
    });
    const bb = join(installDir, 'bb');
    return { ...result, bb, installDir };
  }

  it('installs bb from the archive of the latest release', async () => {
    const { status, stdout, stderr, bb, installDir } = await install();

    expect(stderr).toBe('');
    expect(status).toBe(0);
    expect(stdout).toContain(`Installed bb to ${bb}`);
    expect(stdout).toContain(`Add ${installDir} to your PATH`);
    expect(spawnSync(bb, { encoding: 'utf8' }).stdout).toBe('fake-bb\n');
  });

  it('falls back to the raw binary for releases without archives', async () => {
    const { status, bb } = await install({ BB_VERSION: 'v1.0.0' });

    expect(status).toBe(0);
    expect(spawnSync(bb, { encoding: 'utf8' }).stdout).toBe('fake-bb\n');
  });

  it('refuses a download that does not match SHA256SUMS', async () => {
    const { status, stderr, bb } = await install({ BB_VERSION: '1.0.1' });

    expect(status).not.toBe(0);
    expect(stderr).toContain(`checksum mismatch for ${hostArchive}`);
    expect(existsSync(bb)).toBe(false);
  });

  it('replaces an existing install', async () => {
    const first = await install();
    const { status, bb } = await install(
      { BB_VERSION: '1.0.0' },
      first.installDir
    );

    expect(status).toBe(0);
    expect(await readFile(bb, 'utf8')).toBe(FAKE_BB);
  });

  it('reports a version that does not exist', async () => {
    const { status, stderr } = await install({ BB_VERSION: '9.9.9' });

    expect(status).not.toBe(0);
    expect(stderr).toContain('download failed');
  });
});

// Windows PowerShell 5.1 is what `irm | iex` runs on by default on Windows.
const powershell = isWindows ? 'powershell' : Bun.which('pwsh');
// A cold PowerShell start alone can take several seconds on CI runners.
const POWERSHELL_TIMEOUT_MS = 30_000;

// When CI runs `bun test` from pwsh 7, PSModulePath lists pwsh 7's modules
// first, and Windows PowerShell 5.1 then fails to autoload Get-FileHash from
// them. pwsh strips its paths when it launches powershell.exe itself; do the
// same here, so 5.1 rebuilds its default module path.
const powershellEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => name.toLowerCase() !== 'psmodulepath'
  )
);

describe.skipIf(powershell === null)('install.ps1', () => {
  const asset = assetName('bun-windows-x64');
  const archive = archiveName('bun-windows-x64');

  beforeAll(async () => {
    const zip = await makeArchive('bb.exe', 'from-archive', 'zip');
    await writeRelease('latest/download', {
      [asset]: 'raw binary',
      [archive]: zip,
    });
    await writeRelease('download/v1.0.0', { [asset]: 'raw binary' });
    await writeRelease(
      'download/v1.0.1',
      { [archive]: zip },
      { [archive]: 'tampered' }
    );
  });

  async function install(
    env: Record<string, string> = {},
    installDir?: string
  ) {
    installDir ??= await mkdtemp(join(tmpDir, 'bin-'));
    const result = await runScript(
      powershell!,
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        join(SCRIPTS_DIR, 'install.ps1'),
      ],
      {
        ...powershellEnv,
        LOCALAPPDATA: process.env.LOCALAPPDATA ?? tmpDir,
        BB_RELEASES_URL: releasesUrl(),
        BB_INSTALL_DIR: installDir,
        ...env,
      }
    );
    return { ...result, bb: join(installDir, 'bb.exe'), installDir };
  }

  it(
    'installs bb.exe from the archive of the latest release',
    async () => {
      const { status, stdout, bb, installDir } = await install();

      expect(status).toBe(0);
      expect(stdout).toContain(`Installed bb to ${bb}`);
      expect(stdout).toContain(`Add ${installDir} to your PATH`);
      expect(await readFile(bb, 'utf8')).toBe('from-archive');
    },
    POWERSHELL_TIMEOUT_MS
  );

  it(
    'falls back to the raw binary for releases without archives',
    async () => {
      const { status, bb } = await install({ BB_VERSION: '1.0.0' });

      expect(status).toBe(0);
      expect(await readFile(bb, 'utf8')).toBe('raw binary');
    },
    POWERSHELL_TIMEOUT_MS
  );

  it(
    'replaces an existing install',
    async () => {
      const first = await install();
      const { status, bb } = await install(
        { BB_VERSION: '1.0.0' },
        first.installDir
      );

      expect(status).toBe(0);
      expect(await readFile(bb, 'utf8')).toBe('raw binary');
    },
    POWERSHELL_TIMEOUT_MS
  );

  it(
    'refuses a download that does not match SHA256SUMS',
    async () => {
      const { status, stderr, bb } = await install({ BB_VERSION: '1.0.1' });

      expect(status).not.toBe(0);
      expect(stderr).toContain(`checksum mismatch for ${archive}`);
      expect(existsSync(bb)).toBe(false);
    },
    POWERSHELL_TIMEOUT_MS
  );
});
