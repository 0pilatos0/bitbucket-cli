/**
 * Behavior tests for the tree-derived shell completer (issue #256).
 *
 * These exercise `generateCompletions` against the live `cli` Commander tree —
 * the replacement for the old hand-maintained completion tables and their drift
 * guard. They assert that subcommands, flags, and enum flag-values are surfaced,
 * and that nested groups sharing a name (`pr comments` vs `snippet comments`)
 * disambiguate structurally.
 */

import { describe, it, expect } from 'bun:test';
import { cli } from '../src/cli.js';
import { generateCompletions } from '../src/completion.js';
import { PR_STATES } from '../src/types/pr.js';
import {
  PullrequestMergeParametersMergeStrategyEnum,
  SnippetsWorkspaceGetRoleEnum,
} from '../src/generated/api.js';

// Convenience: run the completer for a typed line and return candidate names.
function complete(line: string): string[] {
  return generateCompletions(cli, { line }).map((item) => item.name);
}

describe('generateCompletions', () => {
  describe('top-level', () => {
    it('suggests all root commands and global flags after "bb "', () => {
      const names = complete('bb ');
      for (const cmd of [
        'auth',
        'repo',
        'pr',
        'snippet',
        'browse',
        'api',
        'config',
        'completion',
      ]) {
        expect(names).toContain(cmd);
      }
      // Global flags carried on the root program.
      for (const flag of [
        '--json',
        '--jq',
        '--workspace',
        '--repo',
        '--locale',
      ]) {
        expect(names).toContain(flag);
      }
      // Built-ins.
      expect(names).toContain('--help');
      expect(names).toContain('--version');
    });

    it('does not advertise Commander\'s implicit "help" command', () => {
      expect(complete('bb ')).not.toContain('help');
    });

    it('offers --version only at the root, not on subcommands', () => {
      expect(complete('bb pr ')).not.toContain('--version');
    });
  });

  describe('subcommands', () => {
    it('suggests pr subcommands after "bb pr "', () => {
      const names = complete('bb pr ');
      for (const sub of [
        'create',
        'list',
        'view',
        'merge',
        'comments',
        'reviewers',
        'diff',
        'checks',
      ]) {
        expect(names).toContain(sub);
      }
    });

    it('suggests nested group children after "bb repo default-reviewers "', () => {
      const names = complete('bb repo default-reviewers ');
      expect(names).toEqual(expect.arrayContaining(['list', 'add', 'remove']));
    });

    it('completes a partial subcommand token (returns the full set; the shell filters)', () => {
      // The word being typed is "mer"; navigation uses the tokens before it, so
      // the resolved node is still `pr` and `merge` is among the candidates.
      expect(complete('bb pr mer')).toContain('merge');
    });
  });

  describe('structural disambiguation of "comments"', () => {
    const expected = ['list', 'add', 'edit', 'delete'];

    it('pr comments resolves to the pr comments group', () => {
      const names = complete('bb pr comments ');
      expect(names).toEqual(expect.arrayContaining(expected));
    });

    it('snippet comments resolves to the snippet comments group', () => {
      const names = complete('bb snippet comments ');
      expect(names).toEqual(expect.arrayContaining(expected));
    });

    it('is not confused by flags between the parent and "comments"', () => {
      const names = complete('bb pr --json comments ');
      expect(names).toEqual(expect.arrayContaining(expected));
    });
  });

  describe('flag-value completion', () => {
    it('suggests merge strategies after "bb pr merge --strategy "', () => {
      const names = complete('bb pr merge 42 --strategy ');
      expect(names.sort()).toEqual(
        Object.values(PullrequestMergeParametersMergeStrategyEnum).sort()
      );
    });

    it('suggests PR states after "bb pr list --state "', () => {
      const names = complete('bb pr list --state ');
      expect(names.sort()).toEqual([...PR_STATES].sort());
    });

    it('suggests snippet roles after "bb snippet list --role "', () => {
      const names = complete('bb snippet list --role ');
      expect(names.sort()).toEqual(
        Object.values(SnippetsWorkspaceGetRoleEnum).sort()
      );
    });

    it('suggests color modes after "bb pr diff --color "', () => {
      const names = complete('bb pr diff --color ');
      expect(names.sort()).toEqual(['always', 'auto', 'never']);
    });

    it('suggests HTTP methods after "bb api -X " (completion-only, no validation)', () => {
      // `-X/--method` advertises choices for completion but is NOT enforced by
      // Commander, so case-insensitive `bb api -X get` still works.
      const names = complete('bb api -X ');
      expect(names).toEqual(
        expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE'])
      );
      expect(complete('bb api --method ')).toEqual(
        expect.arrayContaining(['GET', 'POST'])
      );
    });

    it('offers nothing for a required value option without choices (free-form value)', () => {
      // After "--title " a free-form string is expected; suggesting flags or
      // subcommands as the value would be wrong.
      expect(complete('bb pr create --title ')).toEqual([]);
    });
  });

  describe('self-documenting descriptions (zsh/fish)', () => {
    // The name-only `complete()` helper above drops descriptions; here we read
    // the raw items to assert the description field is carried, since zsh and
    // fish surface it.
    it('carries a description for subcommands derived from the tree', () => {
      const items = generateCompletions(cli, { line: 'bb pr ' });
      const merge = items.find((item) => item.name === 'merge');
      expect(merge?.description).toBeTruthy();
      // It mirrors the command's own Commander description, not a hand-written
      // duplicate.
      expect(merge?.description).toBe(
        cli.commands
          .find((c) => c.name() === 'pr')
          ?.commands.find((c) => c.name() === 'merge')
          ?.description()
      );
    });

    it('carries a description for option flags', () => {
      const items = generateCompletions(cli, { line: 'bb pr list ' });
      const state = items.find((item) => item.name === '--state');
      expect(state?.description).toBeTruthy();
    });
  });

  describe('option flags', () => {
    it("suggests a command's own flags plus inherited globals", () => {
      const names = complete('bb pr list ');
      expect(names).toContain('--state'); // own flag
      expect(names).toContain('--limit'); // own flag
      expect(names).toContain('--json'); // inherited global
      expect(names).toContain('--help');
    });

    it('does not re-suggest a non-repeatable flag already on the line', () => {
      const names = complete('bb pr list --mine ');
      expect(names).not.toContain('--mine');
      // Other flags are still offered.
      expect(names).toContain('--state');
    });
  });

  describe('global options before a subcommand', () => {
    // A value-taking global flag before the command must not derail navigation:
    // its value token is consumed, not treated as a positional that aborts the
    // walk. Covers the natural `bb [global options] <command>` placement.
    it('resolves the subcommand after "-w <ws> pr "', () => {
      expect(complete('bb -w my-ws pr ')).toEqual(
        expect.arrayContaining(['merge', 'list', 'comments'])
      );
    });

    it('resolves the subcommand after "--repo <x> pr "', () => {
      expect(complete('bb --repo a/b pr ')).toEqual(
        expect.arrayContaining(['merge', 'list'])
      );
    });

    it('still works for a value-less global flag ("--json pr ")', () => {
      expect(complete('bb --json pr ')).toEqual(
        expect.arrayContaining(['merge', 'list'])
      );
    });

    it('resolves an enum flag-value even behind a leading global ("-w x pr merge 42 --strategy ")', () => {
      const names = complete('bb -w x pr merge 42 --strategy ');
      expect(names.sort()).toEqual(
        Object.values(PullrequestMergeParametersMergeStrategyEnum).sort()
      );
    });
  });

  describe('robustness', () => {
    it("stops at an unrecognized positional and offers the node's flags", () => {
      // "42" is a PR id, not a subcommand; navigation stops at `view` and we
      // offer its (inherited) flags rather than walking into nonsense.
      const names = complete('bb pr view 42 ');
      expect(names).toContain('--json');
      expect(names).toContain('--help');
    });

    it('handles an empty / binary-only line by suggesting root commands', () => {
      expect(complete('bb')).toContain('auth');
      expect(complete('bb ')).toContain('pr');
    });
  });
});
