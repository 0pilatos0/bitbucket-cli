/**
 * Shared pieces of the CI watch commands (`pipeline watch`,
 * `pipeline logs --follow`, `pr checks --watch`).
 */

export type Sleep = (ms: number) => Promise<void>;

export const realSleep: Sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Each poll costs a few API calls; 10s keeps an hour-long watch well under
 * Bitbucket's hourly request budget.
 */
export const DEFAULT_POLL_INTERVAL_SECONDS = '10';
