import { describe, it, expect } from 'bun:test';
import {
  collectCommandSections,
  findCommandDocProblems,
} from '../scripts/check-command-docs.js';
import type {
  CommandManifest,
  OptionDescription,
} from '../src/core/command-manifest.js';

function option(long: string): OptionDescription {
  return {
    flags: long,
    long,
    short: null,
    description: '',
    argument: null,
    required: false,
    repeatable: false,
    default: null,
    defaultDescription: null,
    choices: null,
  };
}

function manifest(
  commands: Array<{ path: string; flags?: string[]; subcommands?: string[] }>,
  globalFlags: string[] = []
): CommandManifest {
  return {
    globalOptions: globalFlags.map(option),
    commands: commands.map((cmd) => ({
      path: cmd.path,
      description: '',
      usage: `bb ${cmd.path}`,
      aliases: [],
      subcommands: cmd.subcommands ?? [],
      arguments: [],
      options: (cmd.flags ?? []).map(option),
      examples: [],
    })),
  };
}

describe('collectCommandSections', () => {
  it('ends a section at the next heading of the same level', () => {
    const sections = collectCommandSections(
      [
        '## `bb pr list`',
        '### Options',
        '`--limit`',
        '## `bb pr view`',
        'body',
      ].join('\n')
    );

    expect(sections.get('pr list')?.[0]).toContain('--limit');
    expect(sections.get('pr view')?.[0]).not.toContain('--limit');
  });

  it('ignores # comment lines inside fenced code blocks', () => {
    const sections = collectCommandSections(
      ['## `bb pr list`', '```bash', '# comment', '```', '`--all`'].join('\n')
    );

    expect(sections.get('pr list')?.[0]).toContain('--all');
  });

  it('maps a heading that names several commands to each of them', () => {
    const sections = collectCommandSections(
      '## `bb pr approve`, `bb pr decline` / `bb pr ready`\nshared'
    );

    expect([...sections.keys()]).toEqual([
      'pr approve',
      'pr decline',
      'pr ready',
    ]);
  });

  it('skips headings that only mention a command in prose', () => {
    const sections = collectCommandSections('## Using `bb pr list` in CI');

    expect(sections.size).toBe(0);
  });
});

describe('findCommandDocProblems', () => {
  const sections = collectCommandSections(
    '## `bb pr list`\n`--limit <number>` and `--all`'
  );

  it('passes when every leaf and flag is documented', () => {
    const problems = findCommandDocProblems(
      manifest(
        [
          { path: 'pr', subcommands: ['list'] },
          { path: 'pr list', flags: ['--limit', '--all'] },
        ],
        ['--json']
      ),
      sections,
      '`--json [fields]`'
    );

    expect(problems).toEqual([]);
  });

  it('reports a missing command, flag and global flag', () => {
    const problems = findCommandDocProblems(
      manifest(
        [
          { path: 'pr list', flags: ['--limit', '--state'] },
          { path: 'pr view' },
        ],
        ['--jq']
      ),
      sections,
      '`--json`'
    );

    expect(problems).toEqual([
      'bb pr list: --state is not documented',
      'bb pr view: no `bb pr view` heading',
      'global flag --jq is not documented',
    ]);
  });

  it('lets a <placeholder> heading segment cover every value', () => {
    const problems = findCommandDocProblems(
      manifest([
        { path: 'completion bash' },
        { path: 'completion zsh' },
        { path: 'completion zsh extra' },
      ]),
      collectCommandSections('## `bb completion <shell>`\nprints a script'),
      ''
    );

    expect(problems).toEqual([
      'bb completion zsh extra: no `bb completion zsh extra` heading',
    ]);
  });

  it('does not count a longer flag as a mention of a shorter one', () => {
    const problems = findCommandDocProblems(
      manifest([{ path: 'pr list', flags: ['--lim'] }]),
      sections,
      ''
    );

    expect(problems).toEqual(['bb pr list: --lim is not documented']);
  });
});
