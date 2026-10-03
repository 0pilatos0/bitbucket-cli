import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COMPILE_TARGETS, assetName } from '../scripts/compile.js';
import {
  HOMEBREW_FORMULA_FILE,
  SCOOP_MANIFEST_FILE,
  archiveName,
  homebrewFormula,
  packageRelease,
  scoopManifest,
} from '../scripts/package-release.js';

const VERSION = '9.8.7';
const RELEASE_URL = `https://github.com/0pilatos0/bitbucket-cli/releases/download/v${VERSION}`;

function sha256(data: string | Uint8Array): string {
  return new Bun.CryptoHasher('sha256').update(data).digest('hex');
}

describe('archiveName', () => {
  it('uses .zip for Windows and .tar.gz elsewhere', () => {
    expect(archiveName('bun-windows-x64')).toBe('bb-windows-x64.zip');
    expect(archiveName('bun-linux-arm64')).toBe('bb-linux-arm64.tar.gz');
  });
});

describe('manifests', () => {
  it('refuse to render without the archive checksums', () => {
    expect(() => homebrewFormula(VERSION, new Map())).toThrow(
      'missing checksum for bb-darwin-arm64.tar.gz'
    );
    expect(() => scoopManifest(VERSION, new Map())).toThrow(
      'missing checksum for bb-windows-x64.zip'
    );
  });
});

// Archiving shells out to tar and zip, as the Linux release runner does.
describe.skipIf(Bun.which('zip') === null)('packageRelease', () => {
  let dir = '';

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bb-package-test-'));
    for (const target of COMPILE_TARGETS) {
      await writeFile(join(dir, assetName(target)), `binary for ${target}`);
    }
    await packageRelease(dir, VERSION);
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function checksums(): Promise<Map<string, string>> {
    const text = await readFile(join(dir, 'SHA256SUMS'), 'utf8');
    return new Map(
      text
        .trimEnd()
        .split('\n')
        .map((line) => {
          const [hash, file] = line.split('  ');
          return [file!, hash!];
        })
    );
  }

  it('lists every binary and archive in SHA256SUMS with its real hash', async () => {
    const sums = await checksums();
    const expected = COMPILE_TARGETS.flatMap((t) => [
      assetName(t),
      archiveName(t),
    ]).sort();

    expect([...sums.keys()]).toEqual(expected);
    for (const [file, hash] of sums) {
      expect(sha256(await readFile(join(dir, file)))).toBe(hash);
    }
  });

  it('archives an executable bb and the license', () => {
    const tar = spawnSync('tar', ['-tvzf', join(dir, 'bb-linux-x64.tar.gz')], {
      encoding: 'utf8',
    });
    const entries = tar.stdout.trim().split('\n');
    expect(entries).toHaveLength(2);
    // GNU tar prints `0/0`, bsdtar `<links> 0 0`.
    expect(entries.find((e) => e.endsWith(' bb'))).toMatch(
      /^-rwxr-xr-x\s+(0\/0|\d+\s+0\s+0)\s/
    );
    expect(entries.some((e) => e.endsWith(' LICENSE'))).toBe(true);

    const zip = spawnSync('unzip', ['-Z1', join(dir, 'bb-windows-x64.zip')], {
      encoding: 'utf8',
    });
    expect(zip.stdout.trim().split('\n')).toEqual(['bb.exe', 'LICENSE']);
  });

  it('pins every archive in the Homebrew formula', async () => {
    const sums = await checksums();
    const formula = await readFile(join(dir, HOMEBREW_FORMULA_FILE), 'utf8');

    for (const target of COMPILE_TARGETS) {
      if (target === 'bun-windows-x64') continue;
      const file = archiveName(target);
      expect(formula).toContain(
        `url "${RELEASE_URL}/${file}"\n      sha256 "${sums.get(file)}"`
      );
    }
    expect(formula).toContain('bin.install "bb"');
  });

  it('pins the Windows archive in the Scoop manifest', async () => {
    const sums = await checksums();
    const manifest = JSON.parse(
      await readFile(join(dir, SCOOP_MANIFEST_FILE), 'utf8')
    );

    expect(manifest.version).toBe(VERSION);
    expect(manifest.bin).toBe('bb.exe');
    expect(manifest.architecture['64bit']).toEqual({
      url: `${RELEASE_URL}/bb-windows-x64.zip`,
      hash: sums.get('bb-windows-x64.zip'),
    });
    expect(manifest.autoupdate.hash.url).toBe('$baseurl/SHA256SUMS');
  });
});
