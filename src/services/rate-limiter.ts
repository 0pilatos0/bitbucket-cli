/**
 * Proactive client-side rate limiting (issue #277).
 *
 * The shared axios instance already reacts to 429s (retry with backoff in
 * `api-client.service.ts`); this module adds pacing BEFORE requests so bulk
 * runs (`--all` page walks, recipes looping over many commands) stay under
 * Bitbucket's ceiling instead of bouncing off it.
 *
 * Two knobs, both deliberately conservative:
 *
 *  - A static floor: minimum spacing between request STARTS. Default 0 —
 *    interactive use gains nothing from artificial delays, and unit tests of
 *    the API client must stay fast.
 *  - Adaptive scarcity: when a response carries `X-RateLimit-Remaining` at or
 *    below {@link SCARCITY_THRESHOLD} together with `X-RateLimit-Reset`
 *    (epoch seconds), the remaining budget is spread across the time left
 *    until the reset, capped at {@link MAX_ADAPTIVE_INTERVAL_MS} per request.
 *    Healthy responses leave this untouched, so normal usage pays no latency.
 */

const RATE_LIMIT_SAFETY_MS = 500;

/**
 * At or below this `X-RateLimit-Remaining`, adaptive throttling kicks in.
 */
export const SCARCITY_THRESHOLD = 10;

/**
 * Upper bound for the adaptive interval so a stale/reset-in-the-past header
 * can never wedge the CLI into multi-second sleeps forever.
 */
export const MAX_ADAPTIVE_INTERVAL_MS = 2000;

/**
 * Compute the delay to put between request starts given the advertised
 * remaining budget and reset time. Returns `null` when the inputs are unusable
 * or there is nothing to adapt to (plenty of budget left), meaning "keep the
 * current interval".
 *
 * Exported pure for direct unit tests.
 */
export function computeAdaptiveInterval(
  remaining: number,
  resetAtMs: number,
  now: number,
  floorMs = 0
): number | null {
  if (!Number.isFinite(remaining) || remaining < 0) {
    return null;
  }
  if (!Number.isFinite(resetAtMs)) {
    return null;
  }
  // Plenty of headroom: adaptive throttling would only add latency.
  if (remaining > SCARCITY_THRESHOLD) {
    return null;
  }

  const budgetMs = Math.max(resetAtMs - RATE_LIMIT_SAFETY_MS - now, 0);
  // Zero budget left: pace as slowly as allowed; a request that still trips
  // the server limit falls through to the reactive 429 backoff.
  const perRequest =
    remaining > 0 ? budgetMs / remaining : MAX_ADAPTIVE_INTERVAL_MS;
  return Math.round(
    Math.min(Math.max(perRequest, floorMs), MAX_ADAPTIVE_INTERVAL_MS)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseHeaderNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    // Number() parses the WHOLE string, so a malformed header like '4junk'
    // from a misbehaving proxy is rejected instead of silently read as 4.
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Public constructor contract for {@link RateLimiter}.
 */
export interface RateLimiterOptions {
  /**
   * Minimum spacing between request starts, in milliseconds. Non-finite
   * values are normalized to 0.
   */
  minIntervalMs?: number;
}

/**
 * Spaces request starts for one axios instance. Acquire calls are serialized
 * through an internal promise chain so N concurrent callers queue up and each
 * waits its turn instead of all reading the same timestamp and racing.
 */
export class RateLimiter {
  private readonly minIntervalMs: number;
  private adaptiveIntervalMs = 0;
  private lastRequestAt: number | null = null;
  private chain: Promise<void> = Promise.resolve();
  private windowResetAtMs: number | null = null;
  private worstRemainingInWindow: number | null = null;

  constructor(options?: RateLimiterOptions) {
    const minIntervalMs = options?.minIntervalMs ?? 0;
    this.minIntervalMs = Number.isFinite(minIntervalMs)
      ? Math.max(0, minIntervalMs)
      : 0;
  }

  /** Current effective spacing between request starts (for tests/DEBUG). */
  public get intervalMs(): number {
    return Math.max(this.minIntervalMs, this.adaptiveIntervalMs);
  }

  /**
   * Resolve when the caller may start its request. Always awaits — even with
   * zero intervals it serializes callers, which keeps `lastRequestAt` honest
   * under concurrency.
   */
  public async acquire(): Promise<void> {
    const previous = this.chain;
    let release!: () => void;
    this.chain = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      const interval = this.intervalMs;
      if (interval > 0 && this.lastRequestAt !== null) {
        const wait = this.lastRequestAt + interval - Date.now();
        if (wait > 0) {
          await sleep(wait);
        }
      }
      this.lastRequestAt = Date.now();
    } finally {
      release();
    }
  }

  /**
   * Feed response headers back into the limiter. Header names are matched
   * lowercase because axios normalizes them; unknown or malformed values are
   * ignored so non-Bitbucket responses (proxies, gateways) never break it.
   *
   * Scarcity state is scoped to the advertised reset window: responses can
   * arrive out of order under concurrent fetching, and an older, rosier
   * `X-RateLimit-Remaining` from the SAME window must never undo pacing the
   * client already observed as necessary — the most pessimistic budget seen
   * wins until a response reports a newer window.
   */
  public onResponse(headers: unknown): void {
    if (typeof headers !== 'object' || headers === null) {
      return;
    }
    const record = headers as Record<string, unknown>;
    const remaining = parseHeaderNumber(record['x-ratelimit-remaining']);
    const resetSeconds = parseHeaderNumber(record['x-ratelimit-reset']);
    if (remaining === null || resetSeconds === null) {
      return;
    }

    const resetAtMs = resetSeconds * 1000;

    if (
      this.windowResetAtMs !== null &&
      resetAtMs === this.windowResetAtMs &&
      this.worstRemainingInWindow !== null
    ) {
      this.worstRemainingInWindow = Math.min(
        this.worstRemainingInWindow,
        remaining
      );
    } else {
      // First observation in this window, or the server rolled the window:
      // adopt the fresh values wholesale.
      this.windowResetAtMs = resetAtMs;
      this.worstRemainingInWindow = remaining;
    }

    const next = computeAdaptiveInterval(
      this.worstRemainingInWindow,
      this.windowResetAtMs,
      Date.now(),
      this.minIntervalMs
    );
    // `null` means "healthy / unusable" — fall back to the static floor
    // rather than sticking with a scarcity interval computed earlier.
    this.adaptiveIntervalMs = next ?? 0;
  }
}
