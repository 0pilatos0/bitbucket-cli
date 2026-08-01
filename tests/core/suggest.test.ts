/**
 * "Did you mean ...?" matcher tests.
 *
 * The suffix wording is pinned against Commander's own so root-level,
 * subcommand and enum suggestions read identically — see the
 * "wording parity" block. We do NOT import
 * `commander/lib/suggestSimilar.js` to compare dynamically: it is not
 * reachable through the package's `exports` map, so a deep relative import
 * would be untyped and would break on upgrade.
 */

import { describe, it, expect } from 'bun:test';
import {
  suggestSimilar,
  formatDidYouMean,
  didYouMeanSuffix,
} from '../../src/core/suggest.js';
import { PR_STATES } from '../../src/types/pr.js';
import { ISSUE_STATES } from '../../src/commands/issue/shared.js';

const CONFIG_KEYS = [
  'username',
  'defaultWorkspace',
  'skipVersionCheck',
  'versionCheckInterval',
  'prCreateIncludeDefaultReviewers',
];

const PIPELINE_SORTS = [
  'creator.uuid',
  '-creator.uuid',
  'created_on',
  '-created_on',
  'run_creation_date',
  '-run_creation_date',
];

describe('suggestSimilar', () => {
  describe('case folding (the reason this is a port, not a reuse)', () => {
    it('suggests an UPPERCASE candidate for a lowercase typo', () => {
      // The acceptance-criteria example from issue #268. Commander's
      // case-sensitive matcher returns nothing here.
      expect(suggestSimilar('opne', PR_STATES)).toEqual(['OPEN']);
    });

    it('suggests a lowercase candidate for an UPPERCASE typo', () => {
      expect(suggestSimilar('OPNE', PR_STATES)).toEqual(['OPEN']);
      expect(suggestSimilar('OPNE', ISSUE_STATES)).toEqual(['open']);
    });

    it('returns the candidate spelling, never the user input', () => {
      // Whatever comes back must be pasteable as-is.
      for (const match of suggestSimilar('opne', PR_STATES)) {
        expect(PR_STATES).toContain(match);
      }
    });

    it('does not suggest the same word twice when a set mixes cases', () => {
      expect(suggestSimilar('opne', ['open', 'OPEN'])).toEqual(['open']);
    });
  });

  describe('real CLI enum sets', () => {
    it('matches within a lowercase set', () => {
      expect(suggestSimilar('opne', ISSUE_STATES)).toEqual(['open']);
    });

    it('returns the CLI dash spelling of on-hold, not the API space form', () => {
      // ISSUE_STATES rewrites the API's "on hold" to "on-hold" so it works
      // unquoted in a shell; the suggestion must follow.
      expect(suggestSimilar('onhold', ISSUE_STATES)).toEqual(['on-hold']);
    });

    it('suggests merge strategies, methods, activity types and colors', () => {
      expect(
        suggestSimilar('sqush', [
          'merge_commit',
          'squash',
          'fast_forward',
          'squash_fast_forward',
          'rebase_fast_forward',
          'rebase_merge',
        ])
      ).toEqual(['squash']);
      expect(
        suggestSimilar('GTE', [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'HEAD',
          'OPTIONS',
        ])
      ).toEqual(['GET']);
      expect(
        suggestSimilar('coment', [
          'comment',
          'approval',
          'changes_requested',
          'merge',
          'decline',
          'commit',
          'update',
        ])
      ).toEqual(['comment']);
      expect(suggestSimilar('alwyas', ['auto', 'always', 'never'])).toEqual([
        'always',
      ]);
    });

    it('suggests a config key for a near-miss', () => {
      expect(suggestSimilar('defaultWorkspce', CONFIG_KEYS)).toEqual([
        'defaultWorkspace',
      ]);
    });

    it('suggests nothing for the "invalidKey" config test fixture', () => {
      // tests/commands/config.test.ts pins the whole jsonError payload for
      // this exact key. If a suggestion ever fires here, that assertion
      // breaks — this test is the tripwire.
      expect(suggestSimilar('invalidKey', CONFIG_KEYS)).toEqual([]);
    });
  });

  describe('distance and similarity boundaries', () => {
    it('accepts a distance-3 match when nothing closer exists', () => {
      // bestDistance starts AT maxDistance and candidates are accepted on
      // `distance === bestDistance` as well as `<`. A strict-`<`-only port
      // would silently return [] here and diverge from Commander, so
      // `bb pr lst` and `--sort created` would behave inconsistently.
      expect(suggestSimilar('created', PIPELINE_SORTS)).toEqual(['created_on']);
      expect(suggestSimilar('abcdef', ['abcxyz'])).toEqual(['abcxyz']);
    });

    it('rejects a candidate whose length gap exceeds the max distance', () => {
      // editDistance early-exits returning the worst case (11), giving a
      // similarity of 0 — so the descending form is not a co-winner above.
      expect(suggestSimilar('created', PIPELINE_SORTS)).not.toContain(
        '-created_on'
      );
    });

    it('does not mangle values starting with a single dash', () => {
      // Guards the dropped `--`-slicing deviation.
      expect(suggestSimilar('-creatd_on', PIPELINE_SORTS)).toEqual([
        '-created_on',
      ]);
    });

    it('does not slice candidates when the value starts with --', () => {
      // Upstream would compare against `.slice(2)` of every candidate and
      // answer `--reated_on`; we return a real, pasteable value.
      expect(suggestSimilar('--created_on', PIPELINE_SORTS)).toEqual([
        '-created_on',
      ]);
    });

    it('never guesses single-character candidates', () => {
      expect(suggestSimilar('ab', ['a', 'b'])).toEqual([]);
    });

    it('returns nothing when no candidate is close enough', () => {
      expect(suggestSimilar('xyz', PR_STATES)).toEqual([]);
      expect(suggestSimilar('zzzzzzzzzz', ISSUE_STATES)).toEqual([]);
    });

    it('handles an empty candidate list and an empty value', () => {
      expect(suggestSimilar('anything', [])).toEqual([]);
      expect(suggestSimilar('', PR_STATES)).toEqual([]);
    });

    it('exercises the transposition branch', () => {
      // Adjacent swap is distance 1, closer than the two substitutions a
      // plain Levenshtein matrix would charge.
      expect(suggestSimilar('sumbitted', ISSUE_STATES)).toEqual(['submitted']);
    });

    it('returns every candidate tied at the best distance, sorted', () => {
      const matches = suggestSimilar('bar', ['bare', 'barn', 'zzzzzz']);
      expect(matches).toEqual(['bare', 'barn']);
    });
  });
});

describe('formatDidYouMean', () => {
  it('renders a single match', () => {
    // Wording parity with Commander's suggestSimilar (minus its leading
    // newline, which callers add). Keep these two assertions byte-exact:
    // they are what stops root/nested/enum suggestions from drifting apart.
    expect(formatDidYouMean(['list'])).toBe('(Did you mean list?)');
  });

  it('renders multiple matches', () => {
    expect(formatDidYouMean(['a', 'b'])).toBe('(Did you mean one of a, b?)');
  });

  it('renders nothing for no matches', () => {
    expect(formatDidYouMean([])).toBe('');
  });
});

describe('didYouMeanSuffix', () => {
  it('prefixes a newline when there is a suggestion', () => {
    expect(didYouMeanSuffix('opne', PR_STATES)).toBe('\n(Did you mean OPEN?)');
  });

  it('returns an empty string when there is nothing to suggest', () => {
    // Callers append unconditionally, so this must never be '\n'.
    expect(didYouMeanSuffix('xyz', PR_STATES)).toBe('');
  });
});
