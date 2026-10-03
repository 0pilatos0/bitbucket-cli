import { describe, it, expect } from 'bun:test';
import { realSleep } from '../../src/services/polling.js';

describe('realSleep', () => {
  it('resolves after the given delay', async () => {
    const started = performance.now();
    await realSleep(20);
    expect(performance.now() - started).toBeGreaterThanOrEqual(15);
  });
});
