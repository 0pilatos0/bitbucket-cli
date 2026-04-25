#!/usr/bin/env bun
// Verifies every `process.env.X` reference in src/ that is part of the user-
// facing surface is documented in
// docs/src/content/docs/reference/environment-variables.mdx.
// An allowlist excludes runtime-only/internal vars that users do not configure.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');
const srcDir = resolve(repoRoot, 'src');
const docsPath = resolve(
  repoRoot,
  'docs/src/content/docs/reference/environment-variables.mdx'
);

// Vars that are read by the CLI but are not user-configurable knobs and so do
// not belong in the public env vars reference.
const ALLOWLIST = new Set<string>([
  'NODE_ENV', // test guard in BaseCommand
  'COMP_LINE', // shell completion harness
  'APPDATA', // Windows user profile path lookup
]);

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip generated client; users cannot configure its env, and the spec
      // changes independently of our user-facing docs.
      if (full.endsWith(`${join('src', 'generated')}`)) continue;
      yield* walk(full);
    } else if (full.endsWith('.ts')) {
      yield full;
    }
  }
}

const envRe = /process\.env\.([A-Z][A-Z0-9_]*)/g;
const usagesByVar = new Map<string, Set<string>>();
for (const file of walk(srcDir)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(envRe)) {
    const name = m[1];
    if (ALLOWLIST.has(name)) continue;
    const rel = relative(repoRoot, file);
    if (!usagesByVar.has(name)) usagesByVar.set(name, new Set());
    usagesByVar.get(name)!.add(rel);
  }
}

const docsSrc = readFileSync(docsPath, 'utf8');
const documented = new Set<string>();
// Variables in the reference are listed as `| \`NAME\` |` table rows.
for (const m of docsSrc.matchAll(/\|\s*`([A-Z][A-Z0-9_]*)`\s*\|/g)) {
  documented.add(m[1]);
}

const missing: Array<{ name: string; files: string[] }> = [];
for (const [name, files] of usagesByVar) {
  if (!documented.has(name)) {
    missing.push({ name, files: Array.from(files).sort() });
  }
}

// Documented vars that no source file reads. We still expect related vars like
// NO_COLOR / FORCE_COLOR (consumed via the chalk library, not process.env), so
// only fail if the docs row is *also* not referenced indirectly. To keep the
// check noise-free, we just warn.
const undocumentedUsage = new Set(usagesByVar.keys());
const orphaned: string[] = [];
for (const name of documented) {
  if (!undocumentedUsage.has(name)) orphaned.push(name);
}

if (missing.length > 0) {
  console.error('env-vars-check: undocumented environment variables\n');
  for (const m of missing) {
    console.error(`  - ${m.name}`);
    for (const f of m.files) console.error(`      used in ${f}`);
  }
  console.error(
    `\nAdd a row to ${relative(repoRoot, docsPath)} (or extend the allowlist in scripts/check-env-vars-docs.ts if the var is internal).`
  );
  process.exit(1);
}

if (orphaned.length > 0) {
  // Informational only — chalk and other libs read NO_COLOR/FORCE_COLOR.
  console.log(
    `env-vars-check: note: documented vars not directly read in src/ (likely consumed by a library): ${orphaned.join(', ')}`
  );
}

console.log(
  `env-vars-check: ok (${usagesByVar.size} user-facing vars documented)`
);
