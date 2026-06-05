/**
 * Drift guard for the hand-synced CLI registries (issue #255).
 *
 * Three tables must be kept aligned with the code BY HAND, and drift is
 * otherwise silent:
 *
 *  1. The shell-completion tables in src/cli.ts — `ROOT_COMPLETIONS`,
 *     `SUBCOMMAND_COMPLETIONS`, `COMMENTS_SUBCOMMANDS` — must mirror the live
 *     Commander command tree (`cli`) and the declared root options.
 *  2. The `WRAPPER_ARRAY_KEYS` list in src/services/output.service.ts must
 *     contain the array wrapper key emitted by every collection-style command,
 *     in the right order (first match wins for `--json fields` projection).
 *
 * These tests walk the real `cli` tree so adding a command (or a root flag)
 * without updating the completion tables fails CI, mirroring the
 * scripts/check-*-docs.ts drift guards.
 *
 * Carve-outs (intentional, asserted explicitly rather than reconciled):
 *  - `comments` appears under both `pr` and `snippet`; it is keyed by name in
 *    COMMENTS_SUBCOMMANDS, not in SUBCOMMAND_COMPLETIONS.
 *  - `api` is a leaf with a positional `[methodOrEndpoint]`; its
 *    SUBCOMMAND_COMPLETIONS entry lists HTTP method *values*, not subcommands.
 */

import { describe, it, expect } from 'bun:test';
import type { Command } from 'commander';
import {
  cli,
  ROOT_COMPLETIONS,
  SUBCOMMAND_COMPLETIONS,
  COMMENTS_SUBCOMMANDS,
} from '../src/cli.js';
import { WRAPPER_ARRAY_KEYS } from '../src/services/output.service.js';

// Commander adds an implicit `help` subcommand to nodes in some
// configurations; never advertise it as a real command.
function realChildNames(cmd: Command): string[] {
  return cmd.commands
    .map((c) => c.name())
    .filter((n) => n !== 'help')
    .sort();
}

// Every descendant node that itself has subcommands (a "group"), excluding the
// root program.
function collectGroups(cmd: Command, acc: Command[] = []): Command[] {
  for (const child of cmd.commands) {
    if (child.commands.length > 0) {
      acc.push(child);
    }
    collectGroups(child, acc);
  }
  return acc;
}

function allNodes(cmd: Command, acc: Command[] = []): Command[] {
  for (const child of cmd.commands) {
    acc.push(child);
    allNodes(child, acc);
  }
  return acc;
}

// `comments` lives under both `pr` and `snippet`; reconciled by name.
const SPECIAL_PARENTS: Record<string, string[]> = {
  comments: [...COMMENTS_SUBCOMMANDS].sort(),
};

// `api` is a leaf whose completion entry holds HTTP-method argument values, not
// real subcommands — excluded from tree reconciliation, asserted separately.
const API_VALUE_COMPLETIONS = new Set(['api']);

describe('CLI completion drift (issue #255)', () => {
  describe('Guard 1: command tree <-> completion tables', () => {
    it('top-level command tokens match the real tree', () => {
      const cmdTokens = ROOT_COMPLETIONS.filter(
        (t) => !t.startsWith('-')
      ).sort();
      expect(cmdTokens).toEqual(realChildNames(cli));
    });

    it('root flag tokens match declared options plus built-ins', () => {
      // `--help` is Commander's built-in; `--version` is registered via
      // `.version()` and shows up in `cli.options`. Treat both as built-ins so
      // the check neither requires them from `.option()` nor rejects them.
      const builtins = new Set(['--help', '--version']);
      const declared = new Set(
        cli.options.map((o) => o.long).filter((l): l is string => Boolean(l))
      );
      const flagTokens = ROOT_COMPLETIONS.filter((t) => t.startsWith('--'));

      // No phantom flags advertised that aren't real.
      for (const flag of flagTokens) {
        expect(declared.has(flag) || builtins.has(flag)).toBe(true);
      }

      // Every user-declared root option is advertised for completion. This is
      // the assertion that catches a newly added global flag (e.g. it caught
      // the missing `--jq`).
      for (const long of declared) {
        if (builtins.has(long)) continue;
        expect(flagTokens).toContain(long);
      }
    });

    it('every nested group has a completion list with exact children', () => {
      for (const group of collectGroups(cli)) {
        const name = group.name();
        if (API_VALUE_COMPLETIONS.has(name)) continue;

        const expected =
          SPECIAL_PARENTS[name] ?? SUBCOMMAND_COMPLETIONS.get(name);
        expect(
          expected,
          `no completion list for command group "${name}"`
        ).toBeDefined();
        expect(
          [...(expected ?? [])].sort(),
          `children drift under "${name}"`
        ).toEqual(realChildNames(group));
      }
    });

    it('comments group is special-cased, not in SUBCOMMAND_COMPLETIONS', () => {
      expect(SUBCOMMAND_COMPLETIONS.has('comments')).toBe(false);
      const groupsNamedComments = collectGroups(cli).filter(
        (g) => g.name() === 'comments'
      );
      // Present under both `pr` and `snippet`.
      expect(groupsNamedComments.length).toBe(2);
      for (const group of groupsNamedComments) {
        expect(realChildNames(group)).toEqual(SPECIAL_PARENTS.comments);
      }
    });

    it('api is a value-completion leaf, not a subcommand group', () => {
      const api = cli.commands.find((c) => c.name() === 'api');
      expect(api, 'api command not found').toBeDefined();
      expect(realChildNames(api as Command)).toEqual([]);
      // The documented HTTP-method completion values still exist.
      expect(SUBCOMMAND_COMPLETIONS.get('api')).toBeDefined();
    });

    it('no orphan SUBCOMMAND_COMPLETIONS keys', () => {
      const groupNames = new Set(collectGroups(cli).map((g) => g.name()));
      for (const key of SUBCOMMAND_COMPLETIONS.keys()) {
        if (API_VALUE_COMPLETIONS.has(key)) continue;
        expect(
          groupNames.has(key),
          `SUBCOMMAND_COMPLETIONS has "${key}" but no such command group exists`
        ).toBe(true);
      }
    });

    it('no command defines an alias (completion tables assume none)', () => {
      for (const node of allNodes(cli)) {
        expect(
          node.aliases(),
          `command "${node.name()}" defines an alias; completion tables must be updated to handle it`
        ).toEqual([]);
      }
    });
  });

  describe('Guard 2: wrapper-array-key registry', () => {
    // The canonical wrapper-key order. `values` is the generic paginated
    // fallback and must stay LAST (first-match-wins in projection).
    const EXPECTED_WRAPPER_ARRAY_KEYS = [
      'pullRequests',
      'repositories',
      'snippets',
      'comments',
      'reviewers',
      'activities',
      'statuses',
      'files',
      'values',
    ];

    // Documents which command emits which array wrapper key. Keeps the registry
    // honest: every value must be registered, and every command path must
    // resolve to a real command (catches renames).
    const COLLECTION_COMMAND_KEYS: Record<string, string> = {
      'pr list': 'pullRequests',
      'repo list': 'repositories',
      'snippet list': 'snippets',
      'pr comments list': 'comments',
      'snippet comments list': 'comments',
      'pr reviewers list': 'reviewers',
      'repo default-reviewers list': 'reviewers',
      'pr activity': 'activities',
      'pr checks': 'statuses',
      'pr diff --stat': 'files',
      'pr diff --name-only': 'files',
    };

    it('WRAPPER_ARRAY_KEYS matches the expected set, in order', () => {
      expect([...WRAPPER_ARRAY_KEYS]).toEqual(EXPECTED_WRAPPER_ARRAY_KEYS);
    });

    it('values is the last fallback element', () => {
      expect(WRAPPER_ARRAY_KEYS[WRAPPER_ARRAY_KEYS.length - 1]).toBe('values');
    });

    it('has no duplicate keys', () => {
      expect(new Set(WRAPPER_ARRAY_KEYS).size).toBe(WRAPPER_ARRAY_KEYS.length);
    });

    it('every collection command key is registered', () => {
      for (const key of Object.values(COLLECTION_COMMAND_KEYS)) {
        expect(WRAPPER_ARRAY_KEYS).toContain(key);
      }
    });

    it('has no orphan keys beyond the documented fallback', () => {
      const used = new Set(Object.values(COLLECTION_COMMAND_KEYS));
      const allowedOrphans = new Set(['values']);
      const orphans = WRAPPER_ARRAY_KEYS.filter(
        (k) => !used.has(k) && !allowedOrphans.has(k)
      );
      expect(orphans).toEqual([]);
    });

    it('every documented command path resolves to a real command', () => {
      for (const path of Object.keys(COLLECTION_COMMAND_KEYS)) {
        const tokens = path.split(' ').filter((t) => !t.startsWith('-'));
        let node: Command | undefined = cli;
        for (const token of tokens) {
          node = node?.commands.find((c) => c.name() === token);
          expect(
            node,
            `command path "${path}" does not resolve (at "${token}")`
          ).toBeDefined();
        }
      }
    });
  });
});
