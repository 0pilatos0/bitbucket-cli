#!/usr/bin/env bun
// Build the CLI bundle and stage the jq-wasm binary next to it.
//
// The jq runtime is bundled into the single dist/index.js, but it resolves its
// WebAssembly asset at runtime relative to the bundle location
// (`<bundleDir>/build/jq.wasm`). Staging the wasm here is what keeps `--jq`
// working in the published package (issue #309).
//
// Usage: bun scripts/build.ts [--outdir <dir>]
//   --outdir  Output directory (default: dist/). Overridable so the dist
//             smoke test (tests/dist-jq.smoke.test.ts) can build into a temp
//             dir without touching the repo's real dist/.

import { spawnSync } from 'node:child_process';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');

// jq-wasm resolves `build/jq.wasm` relative to the bundle; this is the asset
// we stage next to it. The path mirrors jq-wasm's published layout.
const JQ_WASM_SOURCE = resolve(
  repoRoot,
  'node_modules/jq-wasm/dist/build/jq.wasm'
);

function parseOutDir(): string {
  const args = process.argv.slice(2);
  let outDir = resolve(repoRoot, 'dist');
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--outdir') {
      const value = args[i + 1];
      if (value === undefined) {
        console.error('build: --outdir requires a value');
        process.exit(1);
      }
      outDir = resolve(value);
      i++;
    } else if (arg.startsWith('--outdir=')) {
      outDir = resolve(arg.slice('--outdir='.length));
    } else {
      console.error(`build: unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return outDir;
}

const outDir = parseOutDir();

const bundle = spawnSync(
  process.execPath,
  [
    'build',
    resolve(repoRoot, 'src/index.ts'),
    '--outdir',
    outDir,
    '--target',
    'bun',
    '--sourcemap',
    '--external',
    'tabtab',
  ],
  { stdio: 'inherit' }
);
if (bundle.status !== 0) {
  process.exit(bundle.status ?? 1);
}

try {
  const wasmOutDir = resolve(outDir, 'build');
  await mkdir(wasmOutDir, { recursive: true });
  await cp(JQ_WASM_SOURCE, resolve(wasmOutDir, 'jq.wasm'));
} catch (error) {
  console.error(
    `build: failed to stage the jq-wasm runtime from ${JQ_WASM_SOURCE}. ` +
      'Run `bun install` and retry.'
  );
  if (error instanceof Error) {
    console.error(`build: ${error.message}`);
  }
  process.exit(1);
}

console.log(
  `build: staged jq-wasm runtime at ${resolve(outDir, 'build', 'jq.wasm')}`
);
