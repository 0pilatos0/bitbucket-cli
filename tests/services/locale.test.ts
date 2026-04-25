/**
 * Locale detection tests
 */

import { describe, it, expect } from 'bun:test';
import {
  DEFAULT_LOCALE,
  detectSystemLocale,
  normalizePosixLocale,
  resolveLocale,
} from '../../src/services/locale.js';

describe('normalizePosixLocale', () => {
  it('returns undefined for an empty string', () => {
    expect(normalizePosixLocale('')).toBeUndefined();
  });

  it('returns undefined for whitespace only', () => {
    expect(normalizePosixLocale('   ')).toBeUndefined();
  });

  it('strips a UTF-8 codeset suffix', () => {
    expect(normalizePosixLocale('en_US.UTF-8')).toBe('en-US');
  });

  it('strips a modifier suffix', () => {
    expect(normalizePosixLocale('de_DE@euro')).toBe('de-DE');
  });

  it('strips both codeset and modifier suffixes', () => {
    expect(normalizePosixLocale('fr_FR.UTF-8@currency')).toBe('fr-FR');
  });

  it('passes through an already-BCP-47-shaped tag', () => {
    expect(normalizePosixLocale('ja-JP')).toBe('ja-JP');
  });

  it('replaces underscores with dashes', () => {
    expect(normalizePosixLocale('zh_Hant_TW')).toBe('zh-Hant-TW');
  });

  it('normalises C / POSIX to the default locale', () => {
    expect(normalizePosixLocale('C')).toBe(DEFAULT_LOCALE);
    expect(normalizePosixLocale('POSIX')).toBe(DEFAULT_LOCALE);
    expect(normalizePosixLocale('C.UTF-8')).toBe(DEFAULT_LOCALE);
    expect(normalizePosixLocale('posix')).toBe(DEFAULT_LOCALE);
  });

  it('trims leading and trailing whitespace before processing', () => {
    expect(normalizePosixLocale('  en_US.UTF-8  ')).toBe('en-US');
  });
});

describe('detectSystemLocale', () => {
  it('returns the default locale when no env vars are set', () => {
    expect(detectSystemLocale({})).toBe(DEFAULT_LOCALE);
  });

  it('prefers LC_TIME over LC_ALL and LANG', () => {
    expect(
      detectSystemLocale({
        LC_TIME: 'ja_JP.UTF-8',
        LC_ALL: 'de_DE.UTF-8',
        LANG: 'fr_FR.UTF-8',
      })
    ).toBe('ja-JP');
  });

  it('falls back to LC_ALL when LC_TIME is absent', () => {
    expect(
      detectSystemLocale({
        LC_ALL: 'de_DE.UTF-8',
        LANG: 'fr_FR.UTF-8',
      })
    ).toBe('de-DE');
  });

  it('falls back to LANG when LC_TIME and LC_ALL are absent', () => {
    expect(detectSystemLocale({ LANG: 'fr_FR.UTF-8' })).toBe('fr-FR');
  });

  it('skips empty env vars and continues down the chain', () => {
    expect(
      detectSystemLocale({
        LC_TIME: '',
        LC_ALL: '   ',
        LANG: 'es_ES.UTF-8',
      })
    ).toBe('es-ES');
  });

  it('falls through to default when all values normalise to empty', () => {
    expect(
      detectSystemLocale({
        LC_TIME: '',
        LC_ALL: '   ',
        LANG: '',
      })
    ).toBe(DEFAULT_LOCALE);
  });

  it('treats a C locale as the default rather than a real locale', () => {
    expect(detectSystemLocale({ LANG: 'C.UTF-8' })).toBe(DEFAULT_LOCALE);
  });
});

describe('resolveLocale', () => {
  it('prefers the explicit value over BB_LOCALE and POSIX vars', () => {
    expect(
      resolveLocale({
        explicit: 'pt-BR',
        env: {
          BB_LOCALE: 'de-DE',
          LC_TIME: 'ja_JP.UTF-8',
        },
      })
    ).toBe('pt-BR');
  });

  it('falls back to BB_LOCALE when no explicit value is provided', () => {
    expect(
      resolveLocale({
        env: { BB_LOCALE: 'de-DE', LC_TIME: 'ja_JP.UTF-8' },
      })
    ).toBe('de-DE');
  });

  it('falls back to POSIX detection when BB_LOCALE is unset', () => {
    expect(resolveLocale({ env: { LC_TIME: 'ja_JP.UTF-8' } })).toBe('ja-JP');
  });

  it('treats a whitespace-only explicit value as unset', () => {
    expect(
      resolveLocale({ explicit: '   ', env: { BB_LOCALE: 'de-DE' } })
    ).toBe('de-DE');
  });

  it('treats a whitespace-only BB_LOCALE as unset', () => {
    expect(
      resolveLocale({ env: { BB_LOCALE: '   ', LANG: 'fr_FR.UTF-8' } })
    ).toBe('fr-FR');
  });

  it('falls back to the default when nothing is configured', () => {
    expect(resolveLocale({ env: {} })).toBe(DEFAULT_LOCALE);
  });

  it('passes the explicit value through verbatim (does not normalise)', () => {
    // Users typing `--locale en-GB` should get en-GB exactly; the POSIX
    // normaliser is only for env-derived values.
    expect(resolveLocale({ explicit: 'en-GB', env: {} })).toBe('en-GB');
  });
});
