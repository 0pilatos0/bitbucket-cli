/**
 * End-to-end smoke test for the standalone executable built by
 * `scripts/compile.ts` (the release binaries). Compiles for the host target
 * and proves the parts that only break once everything is embedded: the
 * inlined package version, the jq wasm asset and shell completion.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import pkg from '../package.json' with { type: 'json' };
import { isCompileTarget } from '../scripts/compile.js';

const REPO_ROOT = resolve(import.meta.dir, '..');
const COMPILE_TIMEOUT_MS = 120_000;

const hostPlatform =
  process.platform === 'win32' ? 'windows' : process.platform;
const hostTarget = `bun-${hostPlatform}-${process.arch}`;

let tmpDir = '';
let binary = '';
let homeDir = '';

function runBinary(
  args: string[],
  extraEnv: Record<string, string> = {}
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(binary, args, {
    cwd: homeDir,
    encoding: 'utf8',
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
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe.skipIf(!isCompileTarget(hostTarget))(
  `compiled ${hostTarget} binary`,
  () => {
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

    it('reports the package version without a package.json on disk', () => {
      const result = runBinary(['--version']);

      expect(result.stderr).toBe('');
      expect(result.stdout.trim()).toBe(pkg.version);
      expect(result.status).toBe(0);
    });

    it('runs --jq through the embedded jq wasm', () => {
      const result = runBinary([
        'config',
        'list',
        '--json',
        '--jq',
        '.configPath | type',
      ]);

      expect(result.stderr).toBe('');
      expect(result.stdout).toBe('"string"\n');
      expect(result.status).toBe(0);
    });

    it('embeds the bash, zsh and fish completion templates', async () => {
      const contents = await readFile(binary, 'latin1');

      expect(contents.split('begin-{pkgname}-completion').length - 1).toBe(3);
    });

    it('answers shell completion requests', () => {
      const result = runBinary(['completion', '--', 'bb', 'pr', ''], {
        COMP_CWORD: '2',
        COMP_LINE: 'bb pr ',
        COMP_POINT: '6',
        SHELL: '/bin/bash',
      });

      expect(result.status).toBe(0);
      expect(result.stdout.split(/\r?\n/)).toContain('create');
    });
  }
);
