import { describe, expect, it } from 'bun:test';
import {
  getBranchName,
  getCloneLinks,
  getLinkHref,
  toArray,
} from '../../src/types/api-helpers.js';

describe('api helpers', () => {
  it('toArray returns empty array for undefined', () => {
    expect(toArray()).toEqual([]);
  });

  it('toArray converts sets and arrays', () => {
    const setValues = new Set([1, 2, 3]);
    expect(toArray(setValues)).toEqual([1, 2, 3]);

    const arrayValues = [4, 5];
    expect(toArray(arrayValues)).toEqual([4, 5]);
  });

  it('getLinkHref returns link href when present', () => {
    const links = { html: { href: 'https://example.com' } };
    expect(getLinkHref(links, 'html')).toBe('https://example.com');
  });

  it('getLinkHref returns undefined for missing keys', () => {
    const links = { html: { href: 'https://example.com' } };
    expect(getLinkHref(links, 'diff')).toBeUndefined();
  });

  it('getCloneLinks returns clone links list', () => {
    const links = {
      clone: [
        { name: 'https', href: 'https://example.com/repo.git' },
        { name: 'ssh', href: 'git@example.com:repo.git' },
      ],
    };
    expect(getCloneLinks(links)).toEqual([
      { name: 'https', href: 'https://example.com/repo.git' },
      { name: 'ssh', href: 'git@example.com:repo.git' },
    ]);
  });

  it('getBranchName returns branch name when present', () => {
    const endpoint = { branch: { name: 'feature/test' } };
    expect(getBranchName(endpoint)).toBe('feature/test');
  });
});
