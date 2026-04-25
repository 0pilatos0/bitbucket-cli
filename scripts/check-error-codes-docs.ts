#!/usr/bin/env bun
// Verifies every ErrorCode enum value in src/types/errors.ts has a matching
// `### NNNN - NAME` heading in docs/src/content/docs/reference/error-codes.mdx,
// and that the docs do not reference codes that no longer exist.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');
const errorsPath = resolve(repoRoot, 'src/types/errors.ts');
const docsPath = resolve(
  repoRoot,
  'docs/src/content/docs/reference/error-codes.mdx'
);

const errorsSrc = readFileSync(errorsPath, 'utf8');
const docsSrc = readFileSync(docsPath, 'utf8');

interface EnumEntry {
  name: string;
  value: number;
}

const enumBlockMatch = errorsSrc.match(
  /export enum ErrorCode \{([\s\S]*?)\n\}/
);
if (!enumBlockMatch) {
  console.error('error-codes-check: could not locate ErrorCode enum');
  process.exit(2);
}

const codeFromSrc: EnumEntry[] = [];
const memberRe = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\s*,?\s*$/;
for (const line of enumBlockMatch[1].split('\n')) {
  const stripped = line.replace(/\/\/.*$/, '');
  const m = stripped.match(memberRe);
  if (m) {
    codeFromSrc.push({ name: m[1], value: Number.parseInt(m[2], 10) });
  }
}

if (codeFromSrc.length === 0) {
  console.error('error-codes-check: parsed zero enum entries from source');
  process.exit(2);
}

const docHeadingRe = /^###\s+(\d+)\s*-\s*([A-Z][A-Z0-9_]*)\s*$/gm;
const codeFromDocs = new Map<number, string>();
for (const m of docsSrc.matchAll(docHeadingRe)) {
  codeFromDocs.set(Number.parseInt(m[1], 10), m[2]);
}

const missingFromDocs: EnumEntry[] = [];
const mismatched: Array<{ value: number; src: string; doc: string }> = [];
for (const entry of codeFromSrc) {
  const docName = codeFromDocs.get(entry.value);
  if (!docName) {
    missingFromDocs.push(entry);
  } else if (docName !== entry.name) {
    mismatched.push({ value: entry.value, src: entry.name, doc: docName });
  }
}

const srcByValue = new Map(codeFromSrc.map((e) => [e.value, e.name]));
const extraInDocs: Array<{ value: number; name: string }> = [];
for (const [value, name] of codeFromDocs) {
  if (!srcByValue.has(value)) {
    extraInDocs.push({ value, name });
  }
}

const problems: string[] = [];
if (missingFromDocs.length > 0) {
  problems.push(
    `Missing from docs (${missingFromDocs.length}):\n` +
      missingFromDocs.map((e) => `  - ${e.value} ${e.name}`).join('\n')
  );
}
if (extraInDocs.length > 0) {
  problems.push(
    `Documented but not in ErrorCode enum (${extraInDocs.length}):\n` +
      extraInDocs.map((e) => `  - ${e.value} ${e.name}`).join('\n')
  );
}
if (mismatched.length > 0) {
  problems.push(
    `Name mismatch between code and docs (${mismatched.length}):\n` +
      mismatched
        .map((m) => `  - ${m.value}: code=${m.src} docs=${m.doc}`)
        .join('\n')
  );
}

if (problems.length > 0) {
  console.error('error-codes-check: docs are out of sync\n');
  for (const p of problems) {
    console.error(p);
    console.error('');
  }
  console.error(
    `Update ${docsPath.replace(repoRoot + '/', '')} so every ErrorCode has a matching '### NNNN - NAME' section.`
  );
  process.exit(1);
}

console.log(
  `error-codes-check: ok (${codeFromSrc.length} codes documented and in sync)`
);
