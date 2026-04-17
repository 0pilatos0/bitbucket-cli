/**
 * Response parser helper tests
 */

import { describe, expect, it } from 'bun:test';
import {
  getBranchName,
  getCloneLinks,
  getLinkHref,
  getRawContent,
  getUserDisplayName,
  parseDiffstatFiles,
  parsePullrequestActivitiesPage,
} from '../../src/services/response-parsers.js';

describe('response-parsers', () => {
  describe('parseDiffstatFiles', () => {
    it('parses diffstat entries from paginated payloads', () => {
      const parsed = parseDiffstatFiles({
        values: new Set([
          {
            new: { path: 'src/file.ts' },
            old: { path: 'src/file.ts' },
            lines_added: 6,
            lines_removed: 2,
          },
          {
            old: { path: 'README.md' },
            lines_added: 0,
            lines_removed: 1,
          },
          {
            lines_added: 'not-a-number',
            lines_removed: undefined,
          },
        ]),
      });

      expect(parsed).toEqual([
        { path: 'src/file.ts', additions: 6, deletions: 2 },
        { path: 'README.md', additions: 0, deletions: 1 },
        { path: 'unknown', additions: 0, deletions: 0 },
      ]);
    });

    it('returns empty list for non-iterable payloads', () => {
      expect(parseDiffstatFiles({ values: 123 })).toEqual([]);
      expect(parseDiffstatFiles(null)).toEqual([]);
    });
  });

  describe('parsePullrequestActivitiesPage', () => {
    it('parses activity entries and preserves next link', () => {
      const parsedPage = parsePullrequestActivitiesPage({
        next: 'https://api.bitbucket.org?page=2',
        values: new Set([
          {
            comment: {
              id: 42,
              content: { raw: 'Looks good' },
              user: { nickname: 'pilot' },
              created_on: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            approval: {
              user: { display_name: 'Reviewer' },
              date: '2024-01-01T01:00:00.000Z',
            },
          },
          'invalid-entry',
        ]),
      });

      const values = Array.from(parsedPage.values ?? []);
      expect(values).toHaveLength(2);
      expect(values[0].comment?.id).toBe(42);
      expect(values[0].comment?.content?.raw).toBe('Looks good');
      expect(values[0].comment?.user?.nickname).toBe('pilot');
      expect(values[1].approval?.user?.display_name).toBe('Reviewer');
      expect(parsedPage.next).toBe('https://api.bitbucket.org?page=2');
    });

    it('parses changes_requested activity with reason', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            changes_requested: {
              user: { username: 'alice' },
              reason: 'Needs tests',
              date: '2024-02-01T00:00:00.000Z',
            },
          },
        ],
      });
      const values = Array.from(page.values ?? []);
      expect(values).toHaveLength(1);
      expect(values[0].changes_requested?.user?.username).toBe('alice');
      expect(values[0].changes_requested?.reason).toBe('Needs tests');
      expect(values[0].changes_requested?.date).toBe(
        '2024-02-01T00:00:00.000Z'
      );
    });

    it('parses merge activity with commit hash', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            merge: {
              user: { display_name: 'Mergebot' },
              date: '2024-02-02T00:00:00.000Z',
              commit: { hash: 'abc1234' },
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.merge?.user?.display_name).toBe('Mergebot');
      expect(entry.merge?.commit?.hash).toBe('abc1234');
    });

    it('drops merge.commit when it has no hash', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            merge: {
              user: { display_name: 'Mergebot' },
              date: '2024-02-02T00:00:00.000Z',
              commit: {},
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.merge?.commit).toBeUndefined();
    });

    it('parses decline activity', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            decline: {
              user: { nickname: 'carol' },
              date: '2024-02-03T00:00:00.000Z',
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.decline?.user?.nickname).toBe('carol');
    });

    it('parses commit activity with author user', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            commit: {
              date: '2024-02-04T00:00:00.000Z',
              hash: 'deadbeef',
              author: { user: { username: 'dave' } },
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.commit?.hash).toBe('deadbeef');
      expect(entry.commit?.author?.user?.username).toBe('dave');
    });

    it('parses commit activity when author is not a record', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            commit: {
              date: '2024-02-04T00:00:00.000Z',
              hash: 'deadbeef',
              author: 'a string',
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.commit?.author).toBeUndefined();
      expect(entry.commit?.hash).toBe('deadbeef');
    });

    it('parses update activity with title/description/state', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            update: {
              author: { display_name: 'Edgar' },
              date: '2024-02-05T00:00:00.000Z',
              title: 'New title',
              description: 'New description',
              state: 'OPEN',
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.update?.author?.display_name).toBe('Edgar');
      expect(entry.update?.title).toBe('New title');
      expect(entry.update?.description).toBe('New description');
      expect(entry.update?.state).toBe('OPEN');
    });

    it('drops approval objects when every field is missing', () => {
      const page = parsePullrequestActivitiesPage({
        values: [{ approval: {} }, { approval: { user: null } }],
      });
      const values = Array.from(page.values ?? []);
      expect(values).toHaveLength(2);
      expect(values[0].approval).toBeUndefined();
      expect(values[1].approval).toBeUndefined();
    });

    it('drops comment objects when every field is missing', () => {
      const page = parsePullrequestActivitiesPage({
        values: [{ comment: {} }, { comment: { user: 'not a record' } }],
      });
      const values = Array.from(page.values ?? []);
      expect(values[0].comment).toBeUndefined();
      expect(values[1].comment).toBeUndefined();
    });

    it('parses comment without id or content when user or date is present', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            comment: {
              user: { username: 'frank' },
              created_on: '2024-02-10T00:00:00.000Z',
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.comment?.user?.username).toBe('frank');
      expect(entry.comment?.content).toBeUndefined();
    });

    it('keeps a comment with only an author (no user)', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          {
            comment: {
              id: 7,
              author: { nickname: 'greta' },
            },
          },
        ],
      });
      const [entry] = Array.from(page.values ?? []);
      expect(entry.comment?.author?.nickname).toBe('greta');
      expect(entry.comment?.user).toBeUndefined();
    });

    it('treats non-record activity values as empty records', () => {
      // The top-level parseActivity only rejects non-records. Valid records
      // with no known keys produce an entry where every nested field is undefined.
      const page = parsePullrequestActivitiesPage({
        values: [{}, 'bad', 123, null],
      });
      const values = Array.from(page.values ?? []);
      // Only the {} record survives parseActivity's isRecord check.
      expect(values).toHaveLength(1);
      expect(values[0].type).toBeUndefined();
      expect(values[0].comment).toBeUndefined();
    });

    it('returns an empty page for a completely non-iterable payload', () => {
      const page = parsePullrequestActivitiesPage({ values: 'oops' });
      expect(Array.from(page.values ?? [])).toEqual([]);
      expect(page.next).toBeUndefined();
    });

    it('preserves the type field on each activity entry', () => {
      const page = parsePullrequestActivitiesPage({
        values: [
          { type: 'comment', comment: { id: 1, user: { username: 'x' } } },
          { type: 'approval', approval: { user: { username: 'y' } } },
        ],
      });
      const values = Array.from(page.values ?? []);
      expect(values.map((v) => v.type)).toEqual(['comment', 'approval']);
    });
  });

  describe('link and field helpers', () => {
    it('extracts href links and clone URLs safely', () => {
      const links = {
        html: { href: 'https://bitbucket.org/workspace/repo' },
        clone: [
          { name: 'ssh', href: 'git@bitbucket.org:workspace/repo.git' },
          { name: 'https', href: 'https://bitbucket.org/workspace/repo.git' },
          { name: 'invalid' },
        ],
      };

      expect(getLinkHref(links, 'html')).toBe(
        'https://bitbucket.org/workspace/repo'
      );
      expect(getCloneLinks(links)).toEqual([
        {
          name: 'ssh',
          href: 'git@bitbucket.org:workspace/repo.git',
        },
        {
          name: 'https',
          href: 'https://bitbucket.org/workspace/repo.git',
        },
      ]);
      expect(getLinkHref(undefined, 'html')).toBeUndefined();
      expect(getCloneLinks({ clone: 'invalid' })).toEqual([]);
    });

    it('extracts branch names, user names, and raw content safely', () => {
      expect(getBranchName({ branch: { name: 'feature/typed-parsers' } })).toBe(
        'feature/typed-parsers'
      );
      expect(getBranchName({ branch: {} })).toBeUndefined();

      expect(
        getUserDisplayName({
          nickname: 'nick',
          display_name: 'Display Name',
          username: 'username',
        })
      ).toBe('nick');
      expect(
        getUserDisplayName({
          display_name: 'Display Name',
          username: 'username',
        })
      ).toBe('Display Name');
      expect(getUserDisplayName({ username: 'username' })).toBe('username');
      expect(getUserDisplayName({})).toBeUndefined();

      expect(getRawContent({ raw: 'comment body' })).toBe('comment body');
      expect(getRawContent({})).toBeUndefined();
    });

    it('returns undefined for link whose href is not a string', () => {
      expect(getLinkHref({ html: { href: 123 } }, 'html')).toBeUndefined();
      expect(getLinkHref({ html: 'not-an-object' }, 'html')).toBeUndefined();
      expect(getLinkHref({}, 'html')).toBeUndefined();
      expect(getLinkHref(null, 'html')).toBeUndefined();
      expect(getLinkHref(42, 'html')).toBeUndefined();
    });

    it('returns empty list when links is not a record', () => {
      expect(getCloneLinks(null)).toEqual([]);
      expect(getCloneLinks(undefined)).toEqual([]);
      expect(getCloneLinks('oops')).toEqual([]);
    });

    it('skips clone entries missing name or href', () => {
      const links = {
        clone: [
          { name: 'ssh' }, // missing href
          { href: 'https://example/a.git' }, // missing name
          null,
          'not-a-record',
          { name: 'https', href: 'https://example/b.git' },
        ],
      };
      expect(getCloneLinks(links)).toEqual([
        { name: 'https', href: 'https://example/b.git' },
      ]);
    });

    it('accepts a Set of clone links (iterable protocol)', () => {
      const links = {
        clone: new Set([
          { name: 'ssh', href: 'git@host:repo.git' },
          { name: 'https', href: 'https://host/repo.git' },
        ]),
      };
      expect(getCloneLinks(links)).toEqual([
        { name: 'ssh', href: 'git@host:repo.git' },
        { name: 'https', href: 'https://host/repo.git' },
      ]);
    });

    it('returns undefined for empty or non-string user fields', () => {
      expect(getUserDisplayName(null)).toBeUndefined();
      expect(getUserDisplayName('user')).toBeUndefined();
      expect(getUserDisplayName({ nickname: '' })).toBeUndefined();
      expect(getUserDisplayName({ display_name: '' })).toBeUndefined();
      // Falls back to the next non-empty field
      expect(
        getUserDisplayName({
          nickname: '',
          display_name: 'Display',
        })
      ).toBe('Display');
      expect(
        getUserDisplayName({
          nickname: '',
          display_name: '',
          username: 'user',
        })
      ).toBe('user');
    });

    it('returns undefined for branches with non-string names', () => {
      expect(getBranchName({ branch: { name: 123 } })).toBeUndefined();
      expect(getBranchName({ branch: null })).toBeUndefined();
      expect(getBranchName('oops')).toBeUndefined();
      expect(getBranchName({ branch: { name: '' } })).toBeUndefined();
    });

    it('returns undefined for content whose raw is not a string', () => {
      expect(getRawContent(null)).toBeUndefined();
      expect(getRawContent('a string')).toBeUndefined();
      expect(getRawContent({ raw: 123 })).toBeUndefined();
    });
  });

  describe('parseDiffstatFiles edge cases', () => {
    it('prefers new.path over old.path for renamed files', () => {
      const parsed = parseDiffstatFiles({
        values: [
          {
            old: { path: 'old/name.ts' },
            new: { path: 'new/name.ts' },
            lines_added: 1,
            lines_removed: 1,
          },
        ],
      });
      expect(parsed).toEqual([
        { path: 'new/name.ts', additions: 1, deletions: 1 },
      ]);
    });

    it('falls back to old.path when new is missing (deletion)', () => {
      const parsed = parseDiffstatFiles({
        values: [
          {
            old: { path: 'removed.ts' },
            lines_added: 0,
            lines_removed: 10,
          },
        ],
      });
      expect(parsed).toEqual([
        { path: 'removed.ts', additions: 0, deletions: 10 },
      ]);
    });

    it('treats non-record entries as skipped', () => {
      const parsed = parseDiffstatFiles({
        values: [null, 'bad', 42, { new: { path: 'ok.ts' } }],
      });
      expect(parsed).toEqual([{ path: 'ok.ts', additions: 0, deletions: 0 }]);
    });

    it('returns empty list for a missing values field', () => {
      expect(parseDiffstatFiles({})).toEqual([]);
      expect(parseDiffstatFiles(undefined)).toEqual([]);
    });

    it('treats non-finite numbers as 0', () => {
      const parsed = parseDiffstatFiles({
        values: [
          {
            new: { path: 'x.ts' },
            lines_added: Number.NaN,
            lines_removed: Number.POSITIVE_INFINITY,
          },
        ],
      });
      expect(parsed).toEqual([{ path: 'x.ts', additions: 0, deletions: 0 }]);
    });
  });
});
