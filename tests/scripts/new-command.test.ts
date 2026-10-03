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
  cpSync(
    join(repoRoot, 'docs/src/content/docs/commands'),
    join(root, 'docs/src/content/docs/commands'),
    { recursive: true }
  );
  symlinkSync(join(repoRoot, 'node_modules'), join(root, 'node_modules'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('scripts/new-command.ts', () => {
  it('--dry-run reports the plan without writing anything', () => {
    const before = read('src/core/container.ts');

    const result = scaffold('tag', 'list', '--list', '--dry-run');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('src/commands/tag/list.command.ts');
    expect(result.stdout).toContain('src/services/output.service.ts');
    expect(existsSync(join(root, 'src/commands/tag'))).toBe(false);
    expect(read('src/core/container.ts')).toBe(before);
  });

  it('scaffolds a new list group and a verb in an existing group', () => {
    expect(scaffold('tag', 'list', '--list').exitCode).toBe(0);
    expect(scaffold('tag', 'view').exitCode).toBe(0);
    const star = scaffold('snippet', 'star', '--description', 'Star a snippet');
    expect(star.exitCode).toBe(0);
    expect(star.stdout).toContain('Next steps');

    expect(read('src/commands/register.ts')).toContain('registerTagCommands,');
    expect(read('src/services/output.service.ts')).toContain(
      "'tags', // tag list"
    );
    expect(read('tests/cli-completion-drift.test.ts')).toContain(
      "'tag list': 'tags',"
    );
    expect(read('src/commands/snippet/register.ts')).toContain(
      "snippetCmd\n    .command('star')\n    .description('Star a snippet')"
    );
    expect(read('docs/src/content/docs/commands/snippet.mdx')).toContain(
      '## `bb snippet star`\n\nStar a snippet.'
    );
    expect(read('docs/src/content/docs/commands/tag.mdx')).toContain(
      '## `bb tag view`'
    );
  });

  it('produces code that type-checks', () => {
    const result = run(['bun', 'x', 'tsc', '--noEmit', '-p', '.']);
    expect(result.stdout + result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  }, 60_000);

  it('passes the generated tests and the DI and JSON-key drift tests', () => {
    const result = run([
      'bun',
      'test',
      'tests/commands/tag-list.test.ts',
      'tests/commands/tag-view.test.ts',
      'tests/commands/snippet-star.test.ts',
      'tests/core/bootstrap.test.ts',
      'tests/cli-completion-drift.test.ts',
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
      tags: [],
    });
  }, 30_000);

  it('refuses an existing command without touching any file', () => {
    const before = read('src/bootstrap.ts');

    const result = scaffold('snippet', 'star');

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('already exists');
    expect(read('src/bootstrap.ts')).toBe(before);
  });

  it('refuses a top-level leaf command as a group', () => {
    const result = scaffold('browse', 'open');

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('is a top-level command');
  });
});
