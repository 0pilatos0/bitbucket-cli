/**
 * Command-tree walking helpers.
 */

import { describe, it, expect } from 'bun:test';
import { Command } from 'commander';
import {
  buildCommandPath,
  resolveCommandPath,
  visibleChildNames,
} from '../../src/core/command-tree.js';

function makeTree(): Command {
  // The root carries an action handler, like the real CLI: without one
  // Commander materializes an implicit `help` command into visibleCommands().
  const root = new Command('bb').action(() => {});
  const pr = new Command('pr');
  const comments = new Command('comments');
  comments.command('add');
  pr.addCommand(comments);
  pr.command('list');
  root.addCommand(pr);
  root.addCommand(new Command('repo'));
  return root;
}

describe('visibleChildNames', () => {
  it('lists the children Commander would show under Commands:', () => {
    expect(visibleChildNames(makeTree()).sort()).toEqual(['pr', 'repo']);
  });

  it('is empty for a leaf', () => {
    expect(visibleChildNames(new Command('leaf'))).toEqual([]);
  });
});

describe('buildCommandPath', () => {
  it('excludes the root program', () => {
    expect(buildCommandPath(makeTree())).toBe('');
  });

  it('joins a nested path with spaces', () => {
    const root = makeTree();
    const { command } = resolveCommandPath(root, ['pr', 'comments', 'add']);

    expect(buildCommandPath(command)).toBe('pr comments add');
  });

  it('yields a bare name for a top-level command', () => {
    const root = makeTree();
    const { command } = resolveCommandPath(root, ['repo']);

    expect(buildCommandPath(command)).toBe('repo');
  });
});

describe('resolveCommandPath', () => {
  it('resolves an empty path to the root', () => {
    const root = makeTree();
    const { command, unresolved } = resolveCommandPath(root, []);

    expect(command).toBe(root);
    expect(unresolved).toBeUndefined();
  });

  it('walks nested groups', () => {
    const { command, unresolved } = resolveCommandPath(makeTree(), [
      'pr',
      'comments',
    ]);

    expect(command.name()).toBe('comments');
    expect(unresolved).toBeUndefined();
  });

  it('returns the deepest match plus the first bad token', () => {
    const { command, unresolved } = resolveCommandPath(makeTree(), [
      'pr',
      'nope',
      'add',
    ]);

    expect(command.name()).toBe('pr');
    expect(unresolved).toBe('nope');
  });

  it('stops at the root when the first token is unknown', () => {
    const root = makeTree();
    const { command, unresolved } = resolveCommandPath(root, ['nope', 'list']);

    expect(command).toBe(root);
    expect(unresolved).toBe('nope');
  });
});
