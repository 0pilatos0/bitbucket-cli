#!/usr/bin/env bun
// PR gate: a change under src/ needs a changeset, and every changeset added in
// the PR must name this package with a valid bump type. The `no-changeset` PR
// label (passed as --skip-required) waives the requirement, not the validation.
//
// Usage: bun scripts/check-changeset.ts <base-ref> [--skip-required]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BUMP_TYPES = new Set(['patch', 'minor', 'major']);
const CHANGESET_FILE = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;

export interface ChangesetCheckInput {
  // Added, modified or renamed files; deleted ones go in deletedFiles.
  changedFiles: readonly string[];
  deletedFiles: readonly string[];
  readFile: (path: string) => string;
  packageName: string;
  skipRequired: boolean;
}

export function validateChangeset(
  content: string,
  packageName: string
): string[] {
  const lines = content.split(/\r?\n/);
  const end = lines.findIndex((line, i) => i > 0 && line.trimEnd() === '---');
  if (lines[0]?.trimEnd() !== '---' || end === -1) {
    return ['missing `---` frontmatter'];
  }

  const problems: string[] = [];
  for (const raw of lines.slice(1, end)) {
    const line = raw.trim();
    if (line === '') continue;
    const entry = /^(['"]?)(.+?)\1\s*:\s*(\S+)$/.exec(line);
    if (!entry) {
      problems.push(`unparseable frontmatter line: ${line}`);
      continue;
    }
    const [, , name, bump] = entry;
    if (name !== packageName) {
      problems.push(`unknown package '${name}' (expected '${packageName}')`);
    }
    if (!BUMP_TYPES.has(bump!)) {
      problems.push(`invalid bump '${bump}' (use patch, minor or major)`);
    }
  }
  return problems;
}

export function checkChangesets(input: ChangesetCheckInput): string[] {
  const changesets = input.changedFiles.filter((f) => CHANGESET_FILE.test(f));
  const errors = changesets.flatMap((file) =>
    validateChangeset(input.readFile(file), input.packageName).map(
      (problem) => `${file}: ${problem}`
    )
  );

  const touchesSrc = [...input.changedFiles, ...input.deletedFiles].some((f) =>
    f.startsWith('src/')
  );
  if (touchesSrc && changesets.length === 0 && !input.skipRequired) {
    errors.push(
      'src/ changed but no changeset was added. Run `bun run changeset`, ' +
        'or add the `no-changeset` label if users are not affected.'
    );
  }
  return errors;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const base = args.find((a) => !a.startsWith('--'));
  if (!base) {
    console.error(
      'Usage: bun scripts/check-changeset.ts <base-ref> [--skip-required]'
    );
    process.exit(2);
  }

  const repoRoot = resolve(import.meta.dir, '..');
  // Deleted files are listed separately: the Version Packages PR removes
  // consumed changesets, which must not be read or counted, but a deleted
  // src/ file still needs a changeset.
  const diffFiles = (filter: string): string[] => {
    const diff = Bun.spawnSync(
      [
        'git',
        'diff',
        '--name-only',
        `--diff-filter=${filter}`,
        `${base}...HEAD`,
      ],
      { cwd: repoRoot }
    );
    if (diff.exitCode !== 0) {
      console.error(`changeset-check: git diff failed\n${diff.stderr}`);
      process.exit(2);
    }
    return diff.stdout.toString().split('\n').filter(Boolean);
  };

  const pkg = JSON.parse(
    readFileSync(resolve(repoRoot, 'package.json'), 'utf8')
  ) as { name: string };
  const errors = checkChangesets({
    changedFiles: diffFiles('d'),
    deletedFiles: diffFiles('D'),
    readFile: (path) => readFileSync(resolve(repoRoot, path), 'utf8'),
    packageName: pkg.name,
    skipRequired: args.includes('--skip-required'),
  });

  if (errors.length > 0) {
    console.error('changeset-check: failed\n');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log('changeset-check: OK');
}
