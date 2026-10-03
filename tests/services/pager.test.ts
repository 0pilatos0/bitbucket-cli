import { describe, expect, it } from 'bun:test';
import { resolvePagerCommand, runPager } from '../../src/services/pager.js';

describe('resolvePagerCommand', () => {
  it('defaults to less -FRX', () => {
    expect(resolvePagerCommand(undefined)).toEqual(['less', '-FRX']);
  });

  it('splits a configured pager into arguments', () => {
    expect(resolvePagerCommand('  most -s ')).toEqual(['most', '-s']);
  });

  it.each(['', '  ', 'cat'])('turns paging off for %p', (value) => {
    expect(resolvePagerCommand(value)).toBeUndefined();
  });
});

describe('runPager', () => {
  it('reports when the pager cannot be started', async () => {
    expect(await runPager(['bb-no-such-pager-binary'], 'text')).toBe(false);
  });
});
