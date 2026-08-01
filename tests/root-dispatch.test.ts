/**
 * Root-invocation dispatch tests.
 *
 * These drive `resolveRootInvocation` as a pure function over a hand-built
 * Commander tree — no `parseAsync`, no module-level singleton, no container.
 * That keeps the decision matrix cheap to cover here and leaves
 * tests/cli-unknown-command.test.ts for the handful of things only a real parse
 * can prove (exit codes, stderr routing, `allowExcessArguments` placement).
 */

import { describe, it, expect } from 'bun:test';
import { Command } from 'commander';
import { resolveRootInvocation } from '../src/root-dispatch.js';
import { ErrorCode } from '../src/types/errors.js';

/** A miniature stand-in for the real tree: three groups, one with children. */
function makeTree(): Command {
  // Root has an action handler, matching the real CLI — that is what suppresses
  // Commander's implicit `help` command and makes this dispatcher necessary.
  const root = new Command('bb').action(() => {});
  const pr = new Command('pr').description('Manage pull requests');
  pr.command('list').description('List PRs');
  const comments = new Command('comments').description('Manage comments');
  comments.command('add').description('Add a comment');
  pr.addCommand(comments);
  root.addCommand(pr);
  root.addCommand(new Command('config').description('Manage config'));
  root.addCommand(new Command('repo').description('Manage repos'));
  return root;
}

const dispatch = (args: string[], jsonOption?: unknown) =>
  resolveRootInvocation(makeTree(), { args, jsonOption });

describe('resolveRootInvocation', () => {
  describe('bare invocation', () => {
    it('is the welcome path', () => {
      const result = dispatch([]);

      expect(result.kind).toBe('help');
      if (result.kind !== 'help') throw new Error('expected help');
      expect(result.command.name()).toBe('bb');
      expect(result.welcome).toBe(true);
    });
  });

  describe('unknown commands', () => {
    it('suggests a close top-level match', () => {
      const result = dispatch(['prr']);

      expect(result.kind).toBe('error');
      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain("unknown command 'prr'");
      expect(result.error.message).toContain('(Did you mean pr?)');
      expect(result.error.code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(result.error.context).toEqual({ command: 'prr' });
    });

    it('falls back to a --help pointer with no close match', () => {
      const result = dispatch(['zzzzzzzzzz']);

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain(
        'Run `bb --help` to see available commands.'
      );
      expect(result.error.message).not.toContain('(Did you mean');
    });

    it('blames the first bad token, not trailing args', () => {
      const result = dispatch(['repoo', 'list']);

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain("unknown command 'repoo'");
      expect(result.error.message).toContain('(Did you mean repo?)');
    });
  });

  describe('--json swallowing a command token', () => {
    it('reports flag position when every token names a real command', () => {
      const result = dispatch(['list'], 'pr');

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain(
        "--json consumed 'pr' as its field list, so 'list' was parsed as a top-level command."
      );
      expect(result.error.message).toContain(
        'Put --json after the subcommand: bb pr list --json'
      );
      expect(result.error.context).toEqual({ command: 'pr', args: ['list'] });
    });

    it('reports flag position for a lone group name', () => {
      // Nothing is left over here, so the "tokens remain" tell cannot fire —
      // this is the case the group-name membership check exists for.
      const result = dispatch([], 'pr');

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain(
        "--json consumed 'pr' as its field list."
      );
      expect(result.error.message).toContain(
        'Put --json after the subcommand: bb pr --json'
      );
    });

    it('blames the MISSPELLED token, not the correct one', () => {
      // Regression guard. Reporting `tokens[0]` (or only checking whether the
      // swallowed value is a known group) blamed 'list' here — the one token
      // the user got right — and offered no suggestion for the actual typo.
      const result = dispatch(['list'], 'prr');

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain("unknown command 'prr'");
      expect(result.error.message).toContain('(Did you mean pr?)');
      expect(result.error.message).not.toContain("'list'");
    });

    it('resolves a bad token at its own depth', () => {
      const result = dispatch(['lst'], 'pr');

      if (result.kind !== 'error') throw new Error('expected error');
      // Candidates come from `pr`, not the root, so `list` is suggestable.
      expect(result.error.message).toContain("unknown command 'lst'");
      expect(result.error.message).toContain('(Did you mean list?)');
    });

    it('treats a genuine field list as a field list', () => {
      // KNOWN LIMITATION, pinned: `--json <non-command>` with nothing left over
      // is indistinguishable from a real projection, so it falls through to
      // root help. Do not "fix" this by guessing.
      expect(dispatch([], 'name,title').kind).toBe('help');
      expect(dispatch([], 'prr').kind).toBe('help');
    });

    it('ignores a boolean or absent --json', () => {
      expect(dispatch([], true).kind).toBe('help');
      expect(dispatch([], undefined).kind).toBe('help');
      expect(dispatch(['prr'], true).kind).toBe('error');
    });

    it('never blames a token that names a real command', () => {
      // Guards the shape of the final branch. Commander dispatches any valid
      // command path before the root action runs — even after a `--` separator
      // (verified: `bb -- pr list` runs the command) — so a fully-resolving
      // token list can only mean a misplaced --json. Whatever we answer here,
      // it must not be "unknown command 'pr'".
      for (const args of [['pr'], ['pr', 'list'], ['repo']]) {
        const result = dispatch(args);
        if (result.kind === 'error') {
          expect(result.error.message).not.toContain('unknown command');
        }
      }
    });
  });

  describe('bb help <command>', () => {
    it('resolves a top-level group', () => {
      const result = dispatch(['help', 'pr']);

      if (result.kind !== 'help') throw new Error('expected help');
      expect(result.command.name()).toBe('pr');
      expect(result.welcome).toBe(false);
    });

    it('resolves a nested group', () => {
      const result = dispatch(['help', 'pr', 'comments']);

      if (result.kind !== 'help') throw new Error('expected help');
      expect(result.command.name()).toBe('comments');
    });

    it('resolves a leaf command', () => {
      const result = dispatch(['help', 'pr', 'list']);

      if (result.kind !== 'help') throw new Error('expected help');
      expect(result.command.name()).toBe('list');
    });

    it('treats bare `help` as root help, without the welcome tip', () => {
      const result = dispatch(['help']);

      if (result.kind !== 'help') throw new Error('expected help');
      expect(result.command.name()).toBe('bb');
      expect(result.welcome).toBe(false);
    });

    it('reports an unresolvable target against the right candidates', () => {
      const result = dispatch(['help', 'pr', 'lst']);

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain("unknown command 'lst'");
      expect(result.error.message).toContain('(Did you mean list?)');
    });

    it('points at the nested --help when nothing is close', () => {
      const result = dispatch(['help', 'pr', 'zzzzzzzzzz']);

      if (result.kind !== 'error') throw new Error('expected error');
      expect(result.error.message).toContain(
        'Run `bb pr --help` to see available commands.'
      );
    });
  });
});
