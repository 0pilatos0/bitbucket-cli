import { describe, it, expect } from 'bun:test';
import { Command, Option } from 'commander';
import {
  describeCommandTree,
  leafCommands,
} from '../../src/core/command-manifest.js';
import {
  collectRepeated,
  withCompletionChoices,
} from '../../src/core/command-options.js';
import { createHelpTextBuilder } from '../../src/help-text.js';
import { cli } from '../../src/cli.js';

const buildHelpText = createHelpTextBuilder(true);

function buildTree(): Command {
  const root = new Command('bb').option('--json [fields]', 'Output as JSON');
  const pr = new Command('pr').description('Manage pull requests');
  pr.command('list')
    .description('List pull requests')
    .option('-l, --limit <number>', 'Maximum number of PRs')
    .addOption(
      withCompletionChoices(new Option('-s, --state <state>', 'Filter'), [
        'OPEN',
        'MERGED',
      ])
    )
    .option('--reviewer <name>', 'Reviewer', collectRepeated, [])
    .option('--no-truncate', 'Show full values')
    .option('--commit [sha]', 'Commit, HEAD by default')
    .addOption(new Option('--secret', 'Not for users').hideHelp())
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb pr list', 'bb pr list -s MERGED'],
        defaults: { limit: '25' },
      })
    );
  pr.command('view <id> [files...]')
    .alias('show')
    .description('View a pull request')
    .requiredOption('--format <format>', 'Output format');
  root.addCommand(pr);
  root.command('hidden-cmd', { hidden: true });
  return root;
}

describe('describeCommandTree', () => {
  it('lists every visible command depth-first, without the implicit help', () => {
    const manifest = describeCommandTree(buildTree());

    expect(manifest.commands.map((cmd) => cmd.path)).toEqual([
      'pr',
      'pr list',
      'pr view',
    ]);
    expect(manifest.commands[0]?.subcommands).toEqual(['list', 'view']);
    expect(leafCommands(manifest).map((cmd) => cmd.path)).toEqual([
      'pr list',
      'pr view',
    ]);
  });

  it('reports root options once as globalOptions', () => {
    const manifest = describeCommandTree(buildTree());

    expect(manifest.globalOptions.map((option) => option.flags)).toEqual([
      '--json [fields]',
    ]);
  });

  it('describes options with value placeholder, choices, defaults and repeatability', () => {
    const list = describeCommandTree(buildTree()).commands[1]!;
    const byLong = new Map(list.options.map((o) => [o.long, o]));

    expect(byLong.get('--limit')).toEqual({
      flags: '-l, --limit <number>',
      long: '--limit',
      short: '-l',
      description: 'Maximum number of PRs',
      argument: '<number>',
      required: false,
      repeatable: false,
      default: null,
      defaultDescription: '25',
      choices: null,
    });
    expect(byLong.get('--state')?.choices).toEqual(['OPEN', 'MERGED']);
    expect(byLong.get('--reviewer')).toMatchObject({
      repeatable: true,
      default: [],
    });
    expect(byLong.get('--no-truncate')).toMatchObject({
      argument: null,
      default: null,
      defaultDescription: null,
    });
    expect(byLong.get('--commit')?.argument).toBe('[sha]');
    expect(byLong.has('--secret')).toBe(false);
  });

  it('recovers examples from the help text builder', () => {
    const list = describeCommandTree(buildTree()).commands[1]!;

    expect(list.examples).toEqual(['bb pr list', 'bb pr list -s MERGED']);
  });

  it('describes arguments, aliases, usage and required options', () => {
    const view = describeCommandTree(buildTree()).commands[2]!;

    expect(view.usage).toBe('bb pr view [options] <id> [files...]');
    expect(view.aliases).toEqual(['show']);
    expect(view.arguments).toEqual([
      {
        name: 'id',
        description: '',
        required: true,
        variadic: false,
        choices: null,
      },
      {
        name: 'files',
        description: '',
        required: false,
        variadic: true,
        choices: null,
      },
    ]);
    expect(view.options[0]?.required).toBe(true);
    expect(view.examples).toEqual([]);
  });

  it('scopes to a subtree but still reports the global options', () => {
    const root = buildTree();
    const pr = root.commands.find((cmd) => cmd.name() === 'pr')!;
    const manifest = describeCommandTree(pr.commands[0]!);

    expect(manifest.commands.map((cmd) => cmd.path)).toEqual(['pr list']);
    expect(manifest.globalOptions).toHaveLength(1);
  });

  it('gives every leaf of the real CLI a unique path and its examples', () => {
    const leaves = leafCommands(describeCommandTree(cli));
    const paths = leaves.map((cmd) => cmd.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('pr comments list');
    expect(paths).toContain('context');
    expect(paths).toContain('agent-instructions');
    expect(leaves.find((cmd) => cmd.path === 'context')?.examples).toContain(
      'bb context --json'
    );
  });
});
