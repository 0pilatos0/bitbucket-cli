/**
 * Rate limiter tests (issue #277)
 */

import { describe, expect, it } from 'bun:test';
import {
  computeAdaptiveInterval,
  MAX_ADAPTIVE_INTERVAL_MS,
  RateLimiter,
  SCARCITY_THRESHOLD,
} from '../../src/services/rate-limiter.js';

describe('computeAdaptiveInterval', () => {
  const NOW = 1_000_000;

  it('returns null while plenty of budget remains', () => {
    expect(
      computeAdaptiveInterval(SCARCITY_THRESHOLD + 1, NOW + 60_000, NOW)
    ).toBeNull();
    expect(computeAdaptiveInterval(500, NOW + 60_000, NOW)).toBeNull();
  });

  it('spreads the remaining budget until the reset', () => {
    // 5 requests left, 10s until reset, 500ms safety → (10000-500)/5 = 1900ms
    expect(computeAdaptiveInterval(5, NOW + 10_000, NOW)).toBe(1900);
  });

  it('caps the interval at the configured maximum', () => {
    // Huge window with one request left would suggest minutes of spacing.
    expect(computeAdaptiveInterval(1, NOW + 3_600_000, NOW)).toBe(
      MAX_ADAPTIVE_INTERVAL_MS
    );
  });

  it('paces at the maximum when no budget remains', () => {
    expect(computeAdaptiveInterval(0, NOW + 60_000, NOW)).toBe(
      MAX_ADAPTIVE_INTERVAL_MS
    );
  });

  it('honors the floor when the budget allows faster pacing than requested', () => {
    // Budget math suggests a tiny interval; the floor must win.
    expect(computeAdaptiveInterval(9, NOW + 100, NOW, 50)).toBe(50);
  });

  it('treats a reset in the past as zero budget', () => {
    expect(computeAdaptiveInterval(3, NOW - 5_000, NOW)).toBe(0);
  });

  it('rejects malformed inputs', () => {
    expect(computeAdaptiveInterval(Number.NaN, NOW + 60_000, NOW)).toBeNull();
    expect(computeAdaptiveInterval(-1, NOW + 60_000, NOW)).toBeNull();
    expect(computeAdaptiveInterval(5, Number.NaN, NOW)).toBeNull();
    expect(computeAdaptiveInterval(Number.POSITIVE_INFINITY, NOW, NOW)).toBe(
      null
    );
  });
});

describe('RateLimiter', () => {
  it('does not delay when no intervals are configured', async () => {
    const limiter = new RateLimiter();
    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('spaces request starts by the static floor', async () => {
    const limiter = new RateLimiter({ minIntervalMs: 25 });
    await limiter.acquire();

    const secondStart = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - secondStart;
    // Generous lower bound: scheduling jitter on CI must not flake this.
    expect(elapsed).toBeGreaterThanOrEqual(15);

    await limiter.acquire();
    expect(Date.now() - secondStart).toBeGreaterThanOrEqual(40);
  });

  it('serializes concurrent callers so spacing stays honest', async () => {
    const limiter = new RateLimiter({ minIntervalMs: 20 });
    const starts: number[] = [];
    await Promise.all(
      [0, 1, 2].map(async () => {
        await limiter.acquire();
        starts.push(Date.now());
      })
    );

    expect(starts).toHaveLength(3);
    // Sorted by actual completion order; consecutive gaps respect the floor.
    const sorted = [...starts].sort((a, b) => a - b);
    expect(sorted[1]! - sorted[0]!).toBeGreaterThanOrEqual(15);
    expect(sorted[2]! - sorted[1]!).toBeGreaterThanOrEqual(15);
  });

  it('adapts to scarcity headers and reports the effective interval', () => {
    const limiter = new RateLimiter();
    expect(limiter.intervalMs).toBe(0);

    const now = Date.now();
    limiter.onResponse({
      'x-ratelimit-remaining': '4',
      'x-ratelimit-reset': String(Math.floor(now / 1000) + 20),
    });
    // (20000 - 500) / 4 = 4875 → capped at MAX_ADAPTIVE_INTERVAL_MS.
    expect(limiter.intervalMs).toBe(MAX_ADAPTIVE_INTERVAL_MS);

    // Healthy response clears the scarcity backoff entirely.
    limiter.onResponse({
      'x-ratelimit-remaining': '600',
      'x-ratelimit-reset': String(Math.floor(now / 1000) + 3600),
    });
    expect(limiter.intervalMs).toBe(0);
  });

  it('ignores responses without usable rate-limit headers', () => {
    const limiter = new RateLimiter({ minIntervalMs: 30 });
    limiter.onResponse({});
    limiter.onResponse({ 'x-ratelimit-remaining': 'abc' });
    limiter.onResponse(null);
    expect(limiter.intervalMs).toBe(30);
  });

  it('keeps the static floor as a lower bound under scarcity', () => {
    const limiter = new RateLimiter({ minIntervalMs: 150 });
    const now = Date.now();
    // Adaptive math suggests ~21ms; floor of 150ms must win.
    limiter.onResponse({
      'x-ratelimit-remaining': '9',
      'x-ratelimit-reset': String(Math.floor(now / 1000) + 1),
    });
    expect(limiter.intervalMs).toBe(150);
  });

  it('accepts numeric header values, not only strings', () => {
    const limiter = new RateLimiter();
    const now = Date.now();
    limiter.onResponse({
      'x-ratelimit-remaining': SCARCITY_THRESHOLD,
      'x-ratelimit-reset': Math.floor(now / 1000) + 11,
    });
    // ~11s until reset (±1s of epoch truncation), 500ms safety, 10 requests
    // left → (11000 - 500) / 10 ≈ 1050ms.
    expect(limiter.intervalMs).toBeGreaterThanOrEqual(950);
    expect(limiter.intervalMs).toBeLessThanOrEqual(1050);
  });
});

describe('RateLimiter header strictness and options contract', () => {
  it('normalizes non-finite minIntervalMs to zero', () => {
    expect(new RateLimiter({ minIntervalMs: Number.NaN }).intervalMs).toBe(0);
    expect(
      new RateLimiter({ minIntervalMs: Number.POSITIVE_INFINITY }).intervalMs
    ).toBe(0);
    // Negative values keep clamping to the existing floor of zero.
    expect(new RateLimiter({ minIntervalMs: -5 }).intervalMs).toBe(0);
  });

  it('ignores partially numeric header values like "4junk"', () => {
    const limiter = new RateLimiter({ minIntervalMs: 40 });
    limiter.onResponse({
      'x-ratelimit-remaining': '4junk',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 30),
    });
    // Malformed input must not change pacing at all.
    expect(limiter.intervalMs).toBe(40);
  });

  it('keeps pessimistic pacing when a stale same-window response arrives late', () => {
    const limiter = new RateLimiter();
    const reset = String(Math.floor(Date.now() / 1000) + 60);

    limiter.onResponse({
      'x-ratelimit-remaining': '2',
      'x-ratelimit-reset': reset,
    });
    const scarce = limiter.intervalMs;
    expect(scarce).toBe(MAX_ADAPTIVE_INTERVAL_MS);

    // An older, rosier response from the SAME window arrives late (concurrent
    // fetches resolve out of order) — it must not undo observed scarcity.
    limiter.onResponse({
      'x-ratelimit-remaining': '50',
      'x-ratelimit-reset': reset,
    });
    expect(limiter.intervalMs).toBe(scarce);
  });

  it('clears scarcity when a newer reset window reports healthy budget', () => {
    const limiter = new RateLimiter();
    limiter.onResponse({
      'x-ratelimit-remaining': '1',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 5),
    });
    expect(limiter.intervalMs).toBe(MAX_ADAPTIVE_INTERVAL_MS);

    limiter.onResponse({
      'x-ratelimit-remaining': '500',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
    });
    expect(limiter.intervalMs).toBe(0);
  });
});

describe('RateLimiter window ordering', () => {
  it('ignores responses from older, superseded reset windows', () => {
    const limiter = new RateLimiter();
    const now = Math.floor(Date.now() / 1000);

    // Scarce budget for a LATER window arrives first.
    limiter.onResponse({
      'x-ratelimit-remaining': '2',
      'x-ratelimit-reset': String(now + 120),
    });
    expect(limiter.intervalMs).toBe(MAX_ADAPTIVE_INTERVAL_MS);

    // A stale response from an EARLIER window arrives late — it must not
    // clear the newer window's scarcity pacing.
    limiter.onResponse({
      'x-ratelimit-remaining': '500',
      'x-ratelimit-reset': String(now + 10),
    });
    expect(limiter.intervalMs).toBe(MAX_ADAPTIVE_INTERVAL_MS);
  });
});
