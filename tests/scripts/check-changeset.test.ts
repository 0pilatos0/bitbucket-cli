import { describe, it, expect } from 'bun:test';
import {
  checkChangesets,
  validateChangeset,
} from '../../scripts/check-changeset.js';

const PKG = '@pilatos/bitbucket-cli';

function run(
  files: Record<string, string>,
  changedFiles: string[],
  skipRequired = false,
  deletedFiles: string[] = []
): string[] {
  return checkChangesets({
    changedFiles,
    deletedFiles,
    readFile: (path) => files[path] ?? '',
    packageName: PKG,
    skipRequired,
  });
}

describe('validateChangeset', () => {
  it('accepts single- and double-quoted package names', () => {
    expect(
      validateChangeset(`---\n'${PKG}': patch\n---\n\nFix.\n`, PKG)
    ).toEqual([]);
    expect(validateChangeset(`---\n"${PKG}": minor\n---\nAdd.\n`, PKG)).toEqual(
      []
    );
  });

  it('accepts CRLF line endings', () => {
    expect(
      validateChangeset(`---\r\n'${PKG}': patch\r\n---\r\nFix.\r\n`, PKG)
    ).toEqual([]);
  });

  it('accepts an empty changeset', () => {
    expect(validateChangeset('---\n---\n', PKG)).toEqual([]);
  });

  it('rejects a wrong package name', () => {
    expect(
      validateChangeset(`---\n'bitbucket-cli': patch\n---\nFix.\n`, PKG)
    ).toEqual([`unknown package 'bitbucket-cli' (expected '${PKG}')`]);
  });

  it('rejects an invalid bump type', () => {
    expect(validateChangeset(`---\n'${PKG}': feature\n---\n`, PKG)).toEqual([
      "invalid bump 'feature' (use patch, minor or major)",
    ]);
  });

  it('rejects a closing delimiter with trailing text', () => {
    expect(validateChangeset(`---\n'${PKG}': patch\n---oops\n`, PKG)).toEqual([
      'missing `---` frontmatter',
    ]);
  });

  it('rejects a file without frontmatter', () => {
    expect(validateChangeset('Fix a bug.\n', PKG)).toEqual([
      'missing `---` frontmatter',
    ]);
  });
});

describe('checkChangesets', () => {
  const valid = `---\n'${PKG}': patch\n---\nFix.\n`;

  it('passes when src/ changes come with a changeset', () => {
    expect(
      run({ '.changeset/fix.md': valid }, ['src/cli.ts', '.changeset/fix.md'])
    ).toEqual([]);
  });

  it('fails when src/ changes without a changeset', () => {
    const errors = run({}, ['src/cli.ts', 'tests/cli.test.ts']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('src/ changed but no changeset was added');
  });

  it('does not count the changeset README as a changeset', () => {
    expect(run({}, ['src/cli.ts', '.changeset/README.md'])).toHaveLength(1);
  });

  it('does not require a changeset outside src/', () => {
    expect(run({}, ['tests/cli.test.ts', '.github/workflows/ci.yml'])).toEqual(
      []
    );
  });

  it('requires a changeset when src/ files are only deleted', () => {
    const errors = run({}, [], false, ['src/old.ts']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('src/ changed but no changeset was added');
  });

  it('ignores deleted changesets', () => {
    expect(run({}, ['CHANGELOG.md'], false, ['.changeset/old.md'])).toEqual([]);
  });

  it('waives the requirement when skipped', () => {
    expect(run({}, ['src/cli.ts'], true)).toEqual([]);
  });

  it('still validates changesets when the requirement is skipped', () => {
    expect(
      run(
        { '.changeset/bad.md': `---\n'other-pkg': patch\n---\n` },
        ['.changeset/bad.md'],
        true
      )
    ).toEqual([
      `.changeset/bad.md: unknown package 'other-pkg' (expected '${PKG}')`,
    ]);
  });
});
