import { describe, it, expect } from 'bun:test';
import { dirname } from 'node:path';

const root = `${import.meta.dir}/..`;
const guidanceFiles = [
  'AGENTS.md',
  'tests/AGENTS.md',
  'CONTRIBUTING.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
];

async function read(path: string): Promise<string> {
  return Bun.file(`${root}/${path}`).text();
}

async function loadPackageJson(): Promise<{
  name: string;
  scripts: Record<string, string>;
}> {
  return JSON.parse(await read('package.json'));
}

describe('contributor and agent guidance', () => {
  it('CLAUDE.md imports AGENTS.md instead of repeating it', async () => {
    const firstLine = (await read('CLAUDE.md')).split(/\r?\n/)[0];
    expect(firstLine).toBe('@AGENTS.md');
  });

  it('every nested AGENTS.md has a CLAUDE.md that imports it', async () => {
    const { exitCode, stdout } = Bun.spawnSync(
      ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
      { cwd: root }
    );
    expect(exitCode).toBe(0);
    const nested = stdout
      .toString()
      .split('\n')
      .filter((path) => path.endsWith('/AGENTS.md'));
    expect(nested).toContain('tests/AGENTS.md');
    for (const path of nested) {
      const claude = Bun.file(`${root}/${dirname(path)}/CLAUDE.md`);
      expect(await claude.exists()).toBe(true);
      expect((await claude.text()).trim()).toBe('@AGENTS.md');
    }
  });

  it('`bun run check` covers lint, docs drift, formatting and tests', async () => {
    const { scripts } = await loadPackageJson();
    for (const step of [
      'bun run lint ',
      'bun run lint:docs',
      'bun run format:check',
      'bun test',
    ]) {
      expect(scripts.check).toContain(step);
    }
  });

  it('only references package scripts that exist', async () => {
    const { scripts } = await loadPackageJson();
    for (const file of guidanceFiles) {
      const text = await read(file);
      for (const [, script = ''] of text.matchAll(/bun run ([\w:-]+)/g)) {
        expect({ file, script, exists: script in scripts }).toEqual({
          file,
          script,
          exists: true,
        });
      }
    }
  });

  it('documents the changeset frontmatter with the real package name', async () => {
    const { name } = await loadPackageJson();
    expect(await read('AGENTS.md')).toContain(`'${name}': patch`);
  });
});
