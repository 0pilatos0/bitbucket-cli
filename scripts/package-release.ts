#!/usr/bin/env bun
// Package the compiled release binaries for distribution. Next to each raw
// binary it writes a compressed archive (`.tar.gz`, `.zip` on Windows) holding
// `bb` and the license, then `SHA256SUMS` over binaries and archives, and a
// Homebrew formula and Scoop manifest that pin the archive checksums. The raw
// binaries stay: existing download links and pinned scripts point at them.
//
// Usage: bun scripts/package-release.ts [--dir <dir>]
//   --dir  Directory holding the binaries from compile.ts (default: dist-bin).

import { spawnSync } from 'node:child_process';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import pkg from '../package.json' with { type: 'json' };
import {
  COMPILE_TARGETS,
  assetName,
  isWindowsTarget,
  type CompileTarget,
} from './compile.js';

const REPO_URL = 'https://github.com/0pilatos0/bitbucket-cli';
const HOMEPAGE = 'https://bitbucket-cli.paulvanderlei.com';
const DESCRIPTION = 'Command-line interface for Bitbucket Cloud';

export const HOMEBREW_FORMULA_FILE = 'bitbucket-cli.rb';
export const SCOOP_MANIFEST_FILE = 'bitbucket-cli.json';

const repoRoot = resolve(import.meta.dir, '..');

export function archiveName(target: CompileTarget): string {
  return isWindowsTarget(target)
    ? assetName(target).replace(/\.exe$/, '.zip')
    : `${assetName(target)}.tar.gz`;
}

function downloadUrl(version: string, file: string): string {
  return `${REPO_URL}/releases/download/v${version}/${file}`;
}

/** `sha256sum` text format, so `sha256sum --check` reads it. */
export function formatChecksums(checksums: Map<string, string>): string {
  return [...checksums.keys()]
    .sort()
    .map((file) => `${checksums.get(file)}  ${file}\n`)
    .join('');
}

export function homebrewFormula(
  version: string,
  checksums: Map<string, string>
): string {
  const variant = (block: string, target: CompileTarget) => {
    const file = archiveName(target);
    const sha256 = checksums.get(file);
    if (sha256 === undefined) throw new Error(`missing checksum for ${file}`);
    return [
      `    ${block} do`,
      `      url "${downloadUrl(version, file)}"`,
      `      sha256 "${sha256}"`,
      `    end`,
    ].join('\n');
  };

  return `class BitbucketCli < Formula
  desc "${DESCRIPTION}"
  homepage "${HOMEPAGE}"
  license "${pkg.license}"

  on_macos do
${variant('on_arm', 'bun-darwin-arm64')}
${variant('on_intel', 'bun-darwin-x64')}
  end

  on_linux do
${variant('on_arm', 'bun-linux-arm64')}
${variant('on_intel', 'bun-linux-x64')}
  end

  def install
    bin.install "bb"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/bb --version").strip
  end
end
`;
}

export function scoopManifest(
  version: string,
  checksums: Map<string, string>
): string {
  const file = archiveName('bun-windows-x64');
  const hash = checksums.get(file);
  if (hash === undefined) throw new Error(`missing checksum for ${file}`);

  const manifest = {
    version,
    description: DESCRIPTION,
    homepage: HOMEPAGE,
    license: pkg.license,
    architecture: {
      '64bit': { url: downloadUrl(version, file), hash },
    },
    bin: 'bb.exe',
    checkver: { github: REPO_URL },
    autoupdate: {
      architecture: {
        '64bit': { url: downloadUrl('$version', file) },
      },
      hash: { url: '$baseurl/SHA256SUMS' },
    },
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

async function sha256(path: string): Promise<string> {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(await Bun.file(path).arrayBuffer());
  return hasher.digest('hex');
}

export async function packageRelease(
  dir: string,
  version: string
): Promise<void> {
  const checksums = new Map<string, string>();
  const staging = await mkdtemp(join(tmpdir(), 'bb-package-'));
  try {
    for (const target of COMPILE_TARGETS) {
      const binary = join(dir, assetName(target));
      const archive = resolve(dir, archiveName(target));
      // Artifact downloads drop the executable bit.
      await chmod(binary, 0o755);

      const stage = join(staging, target);
      const bb = isWindowsTarget(target) ? 'bb.exe' : 'bb';
      await mkdir(stage);
      await copyFile(join(repoRoot, 'LICENSE'), join(stage, 'LICENSE'));
      await copyFile(binary, join(stage, bb));
      await chmod(join(stage, bb), 0o755);
      if (isWindowsTarget(target)) {
        run('zip', [
          '-q',
          '-X',
          '-j',
          archive,
          join(stage, bb),
          join(stage, 'LICENSE'),
        ]);
      } else {
        // Root-owned entries, so `sudo tar -x` does not hand the files to
        // whatever uid the build runner had.
        run('tar', [
          '--owner=0',
          '--group=0',
          '--numeric-owner',
          '-czf',
          archive,
          '-C',
          stage,
          bb,
          'LICENSE',
        ]);
      }

      checksums.set(assetName(target), await sha256(binary));
      checksums.set(archiveName(target), await sha256(archive));
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }

  await writeFile(join(dir, 'SHA256SUMS'), formatChecksums(checksums));
  await writeFile(
    join(dir, HOMEBREW_FORMULA_FILE),
    homebrewFormula(version, checksums)
  );
  await writeFile(
    join(dir, SCOOP_MANIFEST_FILE),
    scoopManifest(version, checksums)
  );
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: { dir: { type: 'string', default: 'dist-bin' } },
  });
  const dir = resolve(values.dir);
  await packageRelease(dir, pkg.version);
  console.log(`package-release: packaged v${pkg.version} in ${dir}`);
}
