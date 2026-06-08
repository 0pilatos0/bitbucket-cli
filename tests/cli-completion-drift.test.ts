/**
 * Drift guard for the hand-synced CLI registries (issue #255).
 *
 * Shell completion is now derived from the live Commander tree (issue #256),
 * so the old `ROOT_COMPLETIONS` / `SUBCOMMAND_COMPLETIONS` /
 * `COMMENTS_SUBCOMMANDS` tables — and their drift guard — are gone. Behavioral
 * coverage for the tree-derived completer lives in tests/completion.test.ts.
 *
 * What remains hand-synced and silently drift-prone:
 *
 *  - The `WRAPPER_ARRAY_KEYS` list in src/services/output.service.ts must
 *    contain the array wrapper key emitted by every collection-style command,
 *    in the right order (first match wins for `--json fields` projection).
 *
 * This test walks the real `cli` tree so renaming a collection command without
 * updating the registry fails CI, mirroring the scripts/check-*-docs.ts guards.
 */

import { describe, it, expect } from 'bun:test';
import type { Command } from 'commander';
import { cli } from '../src/cli.js';
import { WRAPPER_ARRAY_KEYS } from '../src/services/output.service.js';

describe('CLI completion drift (issue #255)', () => {
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
