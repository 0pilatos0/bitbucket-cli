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
  });
});
