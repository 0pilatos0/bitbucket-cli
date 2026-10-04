/**
 * Runs scripts/new-command.ts against a throwaway copy of the repo and checks
 * the result type-checks, passes its own and the wiring tests, and runs.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../..');
const script = join(repoRoot, 'scripts/new-command.ts');

let root: string;

function run(
  cmd: string[],
  env: Record<string, string> = {}
): { exitCode: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(cmd, {
    cwd: root,
    env: { ...process.env, HOME: join(root, 'home'), ...env },
  });
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

const scaffold = (...args: string[]) =>
  run(['bun', script, ...args, '--root', root]);

const read = (path: string): string => readFileSync(join(root, path), 'utf8');

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'bb-new-command-'));
  for (const entry of [
    'src',
    'tests',
    'tsconfig.json',
    'package.json',
    'bunfig.toml',
    '.prettierrc',
  ]) {
    cpSync(join(repoRoot, entry), join(root, entry), { recursive: true });
  }
  mkdirSync(join(root, 'docs/src/content/docs'), { recursive: true });
  for (const entry of [
    'docs/src/content/docs/commands',
    'docs/src/content/docs/reference',
    'scripts/check-command-docs.ts',
  ]) {
    cpSync(join(repoRoot, entry), join(root, entry), { recursive: true });
  }
  symlinkSync(
    join(repoRoot, 'node_modules'),
    join(root, 'node_modules'),
    'junction'
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('scripts/new-command.ts', () => {
  it('--dry-run reports the plan without writing anything', () => {
    const before = read('src/core/service-tokens.ts');

    const result = scaffold(
      'tag',
      'list',
      '--list',
      '--wrapper-key',
      'tags',
      '--dry-run'
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('src/commands/tag/list.command.ts');
    expect(result.stdout).toContain('src/services/output.service.ts');
    expect(existsSync(join(root, 'src/commands/tag'))).toBe(false);
    expect(read('src/core/service-tokens.ts')).toBe(before);
  });

  it('scaffolds a new list group and a verb in an existing group', () => {
    expect(
      scaffold('tag', 'list', '--list', '--wrapper-key', 'tags').exitCode
    ).toBe(0);
    expect(scaffold('tag', 'view').exitCode).toBe(0);
    const exportAliases = scaffold(
      'alias',
      'export',
      '--description',
      "Export the user's aliases."
    );
    expect(exportAliases.exitCode).toBe(0);
    expect(exportAliases.stdout).toContain('Next steps');

    expect(read('src/commands/register.ts')).toContain('registerTagCommands,');
    expect(read('src/alias.ts')).toContain("'tag',");
    expect(read('src/services/output.service.ts')).toContain(
      "'tags', // tag list"
    );
    expect(read('tests/cli-completion-drift.test.ts')).toContain(
      "'tag list': 'tags',"
    );
    expect(read('src/commands/alias/register.ts')).toContain(
      `aliasCmd\n    .command('export')\n    .description("Export the user's aliases")`
    );
    expect(read('docs/src/content/docs/commands/alias.mdx')).toContain(
      "## `bb alias export`\n\nExport the user's aliases.\n"
    );
    expect(read('docs/src/content/docs/commands/tag.mdx')).toContain(
      '## `bb tag view`'
    );
  });

  it('produces docs that pass the command docs check', () => {
    const result = run(['bun', 'scripts/check-command-docs.ts']);
    expect(result.stdout + result.stderr).toContain('command-docs-check: ok');
    expect(result.exitCode).toBe(0);
  });

  it('produces code that type-checks', () => {
    const result = run(['bun', 'x', 'tsc', '--noEmit', '-p', '.']);
    expect(result.stdout + result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  }, 60_000);

  it('passes the generated tests and every test that pins the command tree', () => {
    const result = run([
      'bun',
      'test',
      '--update-snapshots',
      'tests/commands/tag-list.test.ts',
      'tests/commands/tag-view.test.ts',
      'tests/commands/alias-export.test.ts',
      'tests/core/bootstrap.test.ts',
      'tests/cli-completion-drift.test.ts',
      'tests/cli.test.ts',
      'tests/alias.test.ts',
      'tests/commands/register.test.ts',
    ]);
    expect(result.stderr).toContain(' 0 fail');
    expect(result.exitCode).toBe(0);
  }, 60_000);

  it('wires the command into the CLI', () => {
    const result = run([
      'bun',
      'src/index.ts',
      'tag',
      'list',
      '-w',
      'acme',
      '-r',
      'demo',
      '--json',
    ]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      workspace: 'acme',
      repoSlug: 'demo',
      count: 0,
      hasMore: false,
      limit: 25,
      tags: [],
    });
  }, 30_000);

  it('places the docs section before a trailing "See also"', () => {
    expect(scaffold('commit', 'ping').exitCode).toBe(0);

    const docs = read('docs/src/content/docs/commands/commit.mdx');
    expect(docs.indexOf('## `bb commit ping`')).toBeGreaterThan(
      docs.indexOf('## `bb commit view`')
    );
    expect(docs.indexOf('## `bb commit ping`')).toBeLessThan(
      docs.indexOf('## See also')
    );
  });

  it('points to the pinned subcommand list and a docs folder', () => {
    const result = scaffold('pr', 'star', '--dry-run');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Add 'star' to the pinned pr subcommand");
    expect(result.stdout).toContain('docs/src/content/docs/commands/pr/');
    expect(result.stdout).toContain('tests/commands/pr/star.test.ts');
    expect(result.stdout).not.toContain('commands/pr.mdx');
  });

  it.each([
    [['snippet', 'list'], 'already exists'],
    [['pr', 'comments'], 'already exists'],
    [['browse', 'open'], 'is a top-level command'],
    [['help', 'me'], 'reserved'],
    [['tag', 'all', '--list'], '--wrapper-key'],
    [['tag', 'all', '--list', '--wrapper-key', 'count'], 'envelope field'],
    [['tag', 'show', '--description', 'Show <id>'], '--description'],
  ])('refuses %p without touching any file', (args, message) => {
    const before = read('src/bootstrap.ts');

    const result = scaffold(...args);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(message);
    expect(read('src/bootstrap.ts')).toBe(before);
  });
});
