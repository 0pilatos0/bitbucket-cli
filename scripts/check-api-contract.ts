#!/usr/bin/env bun
// Contract test for the generated API client (issue #266).
//
// Regenerates src/generated/ from the pinned spec with `bun run generate:api`
// and fails when the committed client differs. Drift between the spec, the
// normalize/patch scripts, and the committed output (or a missed
// regeneration) would otherwise go undetected — only regeneration can prove
// the committed client still matches its inputs.
//
// Exit codes:
//   0 - the regenerated client matches the committed one
//   1 - drift detected, generation failed, or src/generated/ was dirty
//   2 - the check could not be verified (not a git repository)

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const GENERATED_PATH = 'src/generated';
const repoRoot = resolve(import.meta.dir, '..');

const EXIT_CLEAN = 0;
const EXIT_DRIFT = 1;
const EXIT_UNVERIFIABLE = 2;

function gitStatusPorcelain(): { ok: boolean; output: string } {
  const result = spawnSync(
    'git',
    ['status', '--porcelain', '--', GENERATED_PATH],
    { cwd: repoRoot, encoding: 'utf8' }
  );
  return { ok: result.status === 0, output: result.stdout ?? '' };
}

// Refuse to run over uncommitted work: regeneration would overwrite it, and
// the resulting comparison could not be trusted anyway.
const before = gitStatusPorcelain();
if (!before.ok) {
  console.error(
    'api-contract: could not inspect the git working tree; run inside the bitbucket-cli repository'
  );
  process.exit(EXIT_UNVERIFIABLE);
}
if (before.output.trim() !== '') {
  console.error(
    'api-contract: src/generated/ has uncommitted changes; commit or stash them before running'
  );
  process.exit(EXIT_DRIFT);
}

const generate = spawnSync('bun', ['run', 'generate:api'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
if (generate.status !== 0) {
  console.error('api-contract: generation failed (see output above)');
  process.exit(EXIT_DRIFT);
}

const after = gitStatusPorcelain();
if (!after.ok) {
  console.error(
    'api-contract: could not inspect the git working tree after generation'
  );
  process.exit(EXIT_UNVERIFIABLE);
}
const changes = after.output.trim();
if (changes !== '') {
  console.error(
    'api-contract: the regenerated client differs from the committed one:'
  );
  console.error(changes);
  console.error(
    'Run `bun run generate:api`, review the diff, and commit it; if the spec changed upstream, use `bun run update:api`.'
  );
  process.exit(EXIT_DRIFT);
}

console.log('api-contract: generated client matches the pinned spec');
process.exit(EXIT_CLEAN);
