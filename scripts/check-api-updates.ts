#!/usr/bin/env bun
// Keeps the pinned Bitbucket Cloud OpenAPI spec and the generated client in
// sync with upstream.
//
//   bun scripts/check-api-updates.ts check  -> report whether an update exists
//   bun scripts/check-api-updates.ts update -> download the latest spec and
//                                              regenerate the client
//
// Exit codes (both modes):
//   0 - spec is up to date (update is a no-op)
//   1 - a newer spec is available (check) or generation failed (update)
//   2 - the spec could not be verified (network, parse, or missing pin)

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SPEC_URL = 'https://api.bitbucket.org/swagger.json';
const FETCH_TIMEOUT_MS = 10_000;
const repoRoot = resolve(import.meta.dir, '..');
const localSpecPath = resolve(repoRoot, 'specs/bitbucket-cloud.json');

const EXIT_UP_TO_DATE = 0;
const EXIT_UPDATE_AVAILABLE = 1;
const EXIT_UNVERIFIABLE = 2;

interface SpecState {
  local: string;
  localHash: string;
  upstream: string;
  upstreamHash: string;
}

function semanticHash(content: string): string {
  // Compare parsed JSON so formatting/whitespace differences do not count as
  // an update. Throws on malformed content.
  const parsed = JSON.parse(content) as unknown;
  return createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
}

async function fetchUpstreamSpec(): Promise<string> {
  const response = await fetch(SPEC_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const errno = error as Error & { code?: string };
    if (errno.code === 'ENOENT') {
      return `missing ${localSpecPath} - commit the pinned spec to the repo so updates are verifiable`;
    }
    return error.message;
  }
  return String(error);
}

async function loadSpecState(): Promise<SpecState> {
  const local = readFileSync(localSpecPath, 'utf8');
  const upstream = await fetchUpstreamSpec();
  return {
    local,
    localHash: semanticHash(local),
    upstream,
    upstreamHash: semanticHash(upstream),
  };
}

async function runCheck(state: SpecState): Promise<number> {
  if (state.localHash === state.upstreamHash) {
    console.log('api-spec-check: spec is up to date');
    return EXIT_UP_TO_DATE;
  }
  console.error(
    'api-spec-check: a newer Bitbucket Cloud spec is available; run `bun run update:api`'
  );
  return EXIT_UPDATE_AVAILABLE;
}

async function runUpdate(state: SpecState): Promise<number> {
  if (state.localHash === state.upstreamHash) {
    console.log('api-spec-update: spec already up to date');
    return EXIT_UP_TO_DATE;
  }
  writeFileSync(localSpecPath, state.upstream);
  console.log('api-spec-update: updated specs/bitbucket-cloud.json');
  const format = spawnSync('bunx', ['prettier', '--write', localSpecPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (format.status !== 0) {
    console.error(
      'api-spec-update: could not format the spec; run `bun run format` before committing'
    );
  }
  const result = spawnSync('bun', ['run', 'generate:api'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    writeFileSync(localSpecPath, state.local);
    console.error(
      'api-spec-update: generation failed; restored the previous spec (fix issues, then re-run)'
    );
    return EXIT_UPDATE_AVAILABLE;
  }
  console.log('api-spec-update: done');
  return EXIT_UP_TO_DATE;
}

const mode = process.argv[2] ?? 'check';
if (mode !== 'check' && mode !== 'update') {
  console.error('Usage: bun scripts/check-api-updates.ts <check|update>');
  process.exit(EXIT_UNVERIFIABLE);
}

let state: SpecState;
try {
  state = await loadSpecState();
} catch (error) {
  console.error(
    `api-spec-${mode}: could not verify the spec against ${SPEC_URL} (${describeError(error)})`
  );
  process.exit(EXIT_UNVERIFIABLE);
}

process.exit(mode === 'check' ? await runCheck(state) : await runUpdate(state));
