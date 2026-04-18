#!/usr/bin/env bun
// Patches src/generated/api.ts to work around upstream spec issues:
// - Duplicate enum const/type declarations from operations sharing names.
// - PipelineSelector.'type' declared optional while parent ModelObject.'type' is required.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiPath = resolve(import.meta.dir, '../src/generated/api.ts');
let src = readFileSync(apiPath, 'utf8');

const seenConst = new Set<string>();
const seenType = new Set<string>();

src = src.replace(
  /export const (\w+) = \{[\s\S]*?\} as const;\nexport type \1 = typeof \1\[keyof typeof \1\];\n/g,
  (match, name: string) => {
    if (seenConst.has(name)) return '';
    seenConst.add(name);
    seenType.add(name);
    return match;
  }
);

src = src.replace(
  /export interface PipelineSelector extends ModelObject \{\n(\s+\/\*\*[\s\S]*?\*\/\n)?\s+'type'\?: PipelineSelectorTypeEnum;/,
  (match) => match.replace("'type'?:", "'type':")
);

writeFileSync(apiPath, src);
console.log('Patched src/generated/api.ts');
