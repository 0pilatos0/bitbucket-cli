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

const outDirIndex = process.argv.indexOf('--outdir');
const outDir = resolve(
  outDirIndex !== -1 && process.argv[outDirIndex + 1] !== undefined
    ? process.argv[outDirIndex + 1]
    : resolve(repoRoot, 'dist')
);

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

const wasmSrc = resolve(repoRoot, 'node_modules/jq-wasm/dist/build/jq.wasm');
const wasmOutDir = resolve(outDir, 'build');
await mkdir(wasmOutDir, { recursive: true });
await cp(wasmSrc, resolve(wasmOutDir, 'jq.wasm'));
console.log(
  `build: staged jq-wasm runtime at ${resolve(wasmOutDir, 'jq.wasm')}`
);
