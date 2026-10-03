/**
 * Pins the contents of the published npm tarball. Builds the CLI with the
 * production build script into a temp copy of the package, then asks npm what
 * `npm pack` would ship. Catches a sourcemap (5.7 MB of the old 7.7 MB
 * tarball, possibly left over from an older build) or anything else leaking
 * past the `files` whitelist.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const BUILD_TIMEOUT_MS = 60_000;
const PACK_TIMEOUT_MS = 60_000;

interface PackResult {
  files: { path: string }[];
}

let pkgDir = '';
let packed: PackResult;

beforeAll(async () => {
  pkgDir = await mkdtemp(join(tmpdir(), 'bb-npm-pack-'));
  for (const file of ['README.md', 'LICENSE', '.npmignore']) {
    await cp(join(REPO_ROOT, file), join(pkgDir, file));
  }
  // npm pack runs `prepare` even with --ignore-scripts, and its hook
  // installer is a devDependency this copy doesn't have.
  const pkg = JSON.parse(
    await readFile(join(REPO_ROOT, 'package.json'), 'utf8')
  );
  delete pkg.scripts.prepare;
  await writeFile(join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2));
  // A map left behind by an older build must not ship either.
  await mkdir(join(pkgDir, 'dist'));
  await writeFile(join(pkgDir, 'dist', 'index.js.map'), '{}');

  const build = spawnSync(
    process.execPath,
    ['scripts/build.ts', '--outdir', join(pkgDir, 'dist')],
    { cwd: REPO_ROOT, stdio: 'inherit', timeout: BUILD_TIMEOUT_MS }
  );
  if (build.error || build.status !== 0) {
    throw new Error(
      `scripts/build.ts failed: ${build.error?.message ?? `exit code ${build.status}`}`
    );
  }

  // npm is a .cmd shim on Windows, which only runs through a shell.
  const pack = spawnSync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    {
      cwd: pkgDir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      timeout: PACK_TIMEOUT_MS,
    }
  );
  if (pack.error) {
    throw new Error(
      `npm pack could not run (this test needs npm): ${pack.error.message}`
    );
  }
  if (pack.status !== 0) {
    throw new Error(`npm pack failed (${pack.status}): ${pack.stderr}`);
  }
  [packed] = JSON.parse(pack.stdout) as PackResult[];
}, BUILD_TIMEOUT_MS + PACK_TIMEOUT_MS);

afterAll(async () => {
  if (pkgDir) {
    await rm(pkgDir, { recursive: true, force: true });
  }
});

describe('npm package contents', () => {
  it('ships only the bundle, the jq runtime and the package metadata', () => {
    const paths = packed.files.map((file) => file.path).sort();

    expect(paths).toEqual([
      'LICENSE',
      'README.md',
      'dist/build/jq.wasm',
      'dist/index.js',
      'package.json',
    ]);
  });
});
