import { describe, expect, it } from 'bun:test';
import {
  getBranchName,
  getCloneLinks,
  getContentRaw,
  getLinkHref,
  getUserDisplayName,
  toArray,
} from '../../src/types/api-helpers.js';

describe('api helpers', () => {
  it('toArray returns empty array for undefined', () => {
    expect(toArray()).toEqual([]);
  });

  it('toArray returns empty array for null', () => {
    expect(toArray(null)).toEqual([]);
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

  it('getLinkHref returns undefined for invalid input', () => {
    expect(getLinkHref(null, 'html')).toBeUndefined();
    const links = { html: { href: 123 } };
    expect(getLinkHref(links, 'html')).toBeUndefined();
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

  it('getCloneLinks handles invalid input', () => {
    expect(getCloneLinks(null)).toEqual([]);
    const links = { clone: [{ name: 'https' }, { href: 'x' }, {}] };
    expect(getCloneLinks(links)).toEqual([
      { name: 'https', href: undefined },
      { name: undefined, href: 'x' },
    ]);
  });

  it('getBranchName returns branch name when present', () => {
    const endpoint = { branch: { name: 'feature/test' } };
    expect(getBranchName(endpoint)).toBe('feature/test');
  });

  it('getBranchName returns undefined for invalid input', () => {
    expect(getBranchName(null)).toBeUndefined();
    expect(getBranchName({ branch: { name: 123 } })).toBeUndefined();
  });

  it('getUserDisplayName prefers nickname then display name', () => {
    expect(getUserDisplayName({ nickname: 'Nick' })).toBe('Nick');
    expect(getUserDisplayName({ display_name: 'Display' })).toBe('Display');
    expect(getUserDisplayName({ username: 'user' })).toBe('user');
  });

  it('getUserDisplayName returns undefined for invalid input', () => {
    expect(getUserDisplayName(null)).toBeUndefined();
    expect(getUserDisplayName({ nickname: '' })).toBeUndefined();
  });

  it('getContentRaw returns raw content when present', () => {
    expect(getContentRaw({ raw: 'hello' })).toBe('hello');
  });

  it('getContentRaw returns undefined for invalid input', () => {
    expect(getContentRaw(null)).toBeUndefined();
    expect(getContentRaw({ raw: 123 })).toBeUndefined();
  });
});
