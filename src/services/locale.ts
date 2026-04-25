/**
 * Locale detection helpers for date and number formatting.
 *
 * The CLI lets the user pin a locale explicitly (`--locale`, `BB_LOCALE`)
 * and otherwise honours the standard POSIX `LC_TIME`/`LC_ALL`/`LANG` chain
 * before falling back to `en-US`. The fallback matches the historical
 * hard-coded value so users who don't set anything see no behavioural
 * change.
 */

export const DEFAULT_LOCALE = 'en-US';

/**
 * Convert a POSIX-style locale value (e.g. `en_US.UTF-8`, `de_DE@euro`) to
 * a BCP-47 tag accepted by `Intl`. Returns `undefined` if the input is
 * empty or only whitespace, so callers can fall through to the next source
 * in the detection hierarchy.
 *
 * The C / POSIX placeholder locales are normalised to `en-US`: they are
 * machine locales that don't carry user-facing formatting preferences, and
 * `en-US` matches the historical fallback.
 */
export function normalizePosixLocale(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  // Strip codeset (`.UTF-8`) and modifier (`@euro`) suffixes, then convert
  // the underscore separator used by POSIX into the dash BCP-47 expects.
  const base = trimmed.split(/[.@]/, 1)[0]!;
  if (base.length === 0) {
    return undefined;
  }

  const upper = base.toUpperCase();
  if (upper === 'C' || upper === 'POSIX') {
    return DEFAULT_LOCALE;
  }

  return base.replace(/_/g, '-');
}

/**
 * Resolve the system locale by walking the standard POSIX environment
 * variables in priority order: `LC_TIME` (date/time category) → `LC_ALL`
 * (overrides everything) → `LANG` (default category). The first variable
 * with a non-empty, normalisable value wins.
 *
 * `env` is injected so tests can drive the function deterministically and
 * so callers can prefer a captured snapshot of `process.env` over the
 * mutable global.
 */
export function detectSystemLocale(
  env: NodeJS.ProcessEnv = process.env
): string {
  const candidates = [env.LC_TIME, env.LC_ALL, env.LANG];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const normalized = normalizePosixLocale(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * Resolve the locale the CLI should use for human-readable output, in
 * priority order:
 *
 * 1. `--locale` CLI flag (`explicit` argument).
 * 2. `BB_LOCALE` environment variable.
 * 3. POSIX env detection (`LC_TIME` → `LC_ALL` → `LANG`).
 * 4. `en-US` fallback (matches the historical hard-coded behaviour).
 *
 * Whitespace-only values at any layer are treated as unset, so an empty
 * `--locale ""` does not silently mask the env vars below it.
 */
export function resolveLocale(options: {
  explicit?: string;
  env?: NodeJS.ProcessEnv;
}): string {
  const env = options.env ?? process.env;

  if (typeof options.explicit === 'string') {
    const trimmed = options.explicit.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const fromEnvVar = env.BB_LOCALE;
  if (typeof fromEnvVar === 'string') {
    const trimmed = fromEnvVar.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return detectSystemLocale(env);
}
