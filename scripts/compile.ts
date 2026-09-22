#!/usr/bin/env bun
// Compile a self-contained `bb` executable (Bun runtime embedded) for one
// release target.
//
// jq-wasm reads its WebAssembly asset from `<bundle dir>/build/jq.wasm`, so the
// wasm is embedded as a second entrypoint and both outputs are named
// explicitly: the bundle at the `/$bunfs/root` root and the wasm under
// `build/`. Left to the defaults, the layout mirrors the common source
// ancestor and differs between Bun releases (1.3 nests the bundle in `src/`).
//
// Usage: bun scripts/compile.ts --target <target> [--outfile <file>]
//   --target   One of COMPILE_TARGETS.
//   --outfile  Output path (default: dist-bin/bb-<os>-<arch>[.exe]).

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

export const COMPILE_TARGETS = [
  'bun-linux-x64',
  'bun-linux-arm64',
  'bun-darwin-x64',
  'bun-darwin-arm64',
  'bun-windows-x64',
] as const;

export type CompileTarget = (typeof COMPILE_TARGETS)[number];

const repoRoot = resolve(import.meta.dir, '..');

export function defaultOutfile(target: CompileTarget): string {
  const name = `bb-${target.slice('bun-'.length)}`;
  const suffix = target.startsWith('bun-windows-') ? '.exe' : '';
  return resolve(repoRoot, 'dist-bin', `${name}${suffix}`);
}

export function isCompileTarget(value: string): value is CompileTarget {
  return (COMPILE_TARGETS as readonly string[]).includes(value);
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      target: { type: 'string' },
      outfile: { type: 'string' },
    },
  });
  const { target } = values;
  if (target === undefined || !isCompileTarget(target)) {
    console.error(
      `compile: --target must be one of: ${COMPILE_TARGETS.join(', ')}`
    );
    process.exit(1);
  }
  const outfile =
    values.outfile === undefined
      ? defaultOutfile(target)
      : resolve(values.outfile);

  const result = await Bun.build({
    entrypoints: [
      resolve(repoRoot, 'src/index.ts'),
      Bun.resolveSync('jq-wasm/jq.wasm', repoRoot),
    ],
    compile: { target, outfile },
    minify: true,
    naming: { entry: '[name].[ext]', asset: 'build/[name].[ext]' },
  });
  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    console.error(`compile: build failed for ${target}`);
    process.exit(1);
  }

  console.log(`compile: wrote ${outfile}`);
}
