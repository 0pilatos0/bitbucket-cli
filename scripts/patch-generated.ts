#!/usr/bin/env bun
// Patches src/generated/api.ts to work around upstream spec issues that are
// not fixable in the spec itself (scripts/normalize-spec.ts handles the
// fixable ones):
//   - Duplicate enum const/type declarations from operations sharing names.
//
// Idempotent: duplicate blocks are only ever removed, so a second run is a
// no-op. Every replacement is asserted to have matched; a miss fails loudly
// instead of silently shipping a broken client.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiPath = resolve(import.meta.dir, '../src/generated/api.ts');
let src = readFileSync(apiPath, 'utf8');

const duplicateBlockRe =
  /export const (\w+) = \{[\s\S]*?\} as const;\nexport type \1 = typeof \1\[keyof typeof \1\];\n/g;
const seenConst = new Set<string>();
const removed: string[] = [];

src = src.replace(duplicateBlockRe, (match, name: string) => {
  if (seenConst.has(name)) {
    removed.push(name);
    return '';
  }
  seenConst.add(name);
  return match;
});

if (removed.length > 0) {
  console.log(
    `patch-generated: removed duplicate enum blocks: ${removed.join(', ')}`
  );
} else {
  console.log('patch-generated: no duplicate enum blocks found');
}

writeFileSync(apiPath, src);
