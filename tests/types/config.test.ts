/**
 * Config type parsing tests
 */

import { describe, it, expect } from 'bun:test';
import {
  CONFIG_KEYS,
  READABLE_CONFIG_KEYS,
  SETTABLE_CONFIG_KEYS,
  coerceBooleanConfigValue,
  coerceSkipVersionCheckValue,
  coerceVersionCheckIntervalValue,
  isReadableConfigKey,
  isSettableConfigKey,
  isValidConfigKey,
  normalizeReadableConfigValue,
  parseSettableConfigValue,
} from '../../src/types/config.js';
import { ErrorCode } from '../../src/types/errors.js';

describe('parseSettableConfigValue', () => {
  it('should keep defaultWorkspace as string', () => {
    const value = parseSettableConfigValue('defaultWorkspace', 'my-workspace');

    expect(value).toBe('my-workspace');
  });

  it('should parse skipVersionCheck values as booleans', () => {
    expect(parseSettableConfigValue('skipVersionCheck', 'true')).toBe(true);
    expect(parseSettableConfigValue('skipVersionCheck', 'FALSE')).toBe(false);
  });

  it('should reject invalid skipVersionCheck values', () => {
    expect(() => parseSettableConfigValue('skipVersionCheck', 'yes')).toThrow(
      "Invalid value for 'skipVersionCheck'"
    );
  });

  it('should parse versionCheckInterval values as positive integers', () => {
    expect(parseSettableConfigValue('versionCheckInterval', '7')).toBe(7);
  });

  it('should reject invalid versionCheckInterval values', () => {
    expect(() => parseSettableConfigValue('versionCheckInterval', '0')).toThrow(
      "Invalid value for 'versionCheckInterval'"
    );
    expect(() =>
      parseSettableConfigValue('versionCheckInterval', '1.5')
    ).toThrow("Invalid value for 'versionCheckInterval'");
  });
});

describe('coerce typed config values', () => {
  it('should coerce skipVersionCheck from boolean or string', () => {
    expect(coerceSkipVersionCheckValue(true)).toBe(true);
    expect(coerceSkipVersionCheckValue('false')).toBe(false);
    expect(coerceSkipVersionCheckValue('invalid')).toBeUndefined();
  });

  it('should coerce versionCheckInterval from number or string', () => {
    expect(coerceVersionCheckIntervalValue(3)).toBe(3);
    expect(coerceVersionCheckIntervalValue('14')).toBe(14);
    expect(coerceVersionCheckIntervalValue(0)).toBeUndefined();
    expect(coerceVersionCheckIntervalValue('0')).toBeUndefined();
  });
});

describe('normalizeReadableConfigValue', () => {
  it('should normalize typed readable keys', () => {
    expect(normalizeReadableConfigValue('skipVersionCheck', 'true')).toBe(true);
    expect(normalizeReadableConfigValue('versionCheckInterval', '5')).toBe(5);
  });

  it('should return undefined for invalid values', () => {
    expect(
      normalizeReadableConfigValue('skipVersionCheck', 'oops')
    ).toBeUndefined();
    expect(
      normalizeReadableConfigValue('versionCheckInterval', 'nope')
    ).toBeUndefined();
    expect(
      normalizeReadableConfigValue('defaultWorkspace', 123)
    ).toBeUndefined();
  });

  it('returns undefined for null/undefined regardless of key', () => {
    for (const key of READABLE_CONFIG_KEYS) {
      expect(normalizeReadableConfigValue(key, null)).toBeUndefined();
      expect(normalizeReadableConfigValue(key, undefined)).toBeUndefined();
    }
  });

  it('coerces boolean keys from native booleans', () => {
    expect(normalizeReadableConfigValue('skipVersionCheck', false)).toBe(false);
    expect(normalizeReadableConfigValue('skipVersionCheck', true)).toBe(true);
    expect(
      normalizeReadableConfigValue('prCreateIncludeDefaultReviewers', true)
    ).toBe(true);
  });

  it('returns string values for username and defaultWorkspace', () => {
    expect(normalizeReadableConfigValue('username', 'paul')).toBe('paul');
    expect(normalizeReadableConfigValue('defaultWorkspace', 'acme')).toBe(
      'acme'
    );
  });
});

describe('parseSettableConfigValue extended cases', () => {
  it('accepts mixed-case booleans', () => {
    expect(parseSettableConfigValue('skipVersionCheck', 'TrUe')).toBe(true);
    expect(parseSettableConfigValue('skipVersionCheck', '  true ')).toBe(true);
    expect(parseSettableConfigValue('skipVersionCheck', 'False')).toBe(false);
  });

  it('rejects empty string booleans', () => {
    expect(() => parseSettableConfigValue('skipVersionCheck', '')).toThrow(
      "Invalid value for 'skipVersionCheck'"
    );
  });

  it('rejects numeric strings for boolean keys', () => {
    expect(() => parseSettableConfigValue('skipVersionCheck', '1')).toThrow();
    expect(() => parseSettableConfigValue('skipVersionCheck', '0')).toThrow();
  });

  it('rejects leading zeros and signed integers for versionCheckInterval', () => {
    expect(() =>
      parseSettableConfigValue('versionCheckInterval', '01')
    ).toThrow();
    expect(() =>
      parseSettableConfigValue('versionCheckInterval', '+1')
    ).toThrow();
    expect(() =>
      parseSettableConfigValue('versionCheckInterval', '-1')
    ).toThrow();
  });

  it('accepts large positive integers for versionCheckInterval', () => {
    expect(parseSettableConfigValue('versionCheckInterval', '86400')).toBe(
      86400
    );
  });

  it('rejects integers exceeding MAX_SAFE_INTEGER', () => {
    const unsafe = String(Number.MAX_SAFE_INTEGER) + '0';
    expect(() =>
      parseSettableConfigValue('versionCheckInterval', unsafe)
    ).toThrow();
  });

  it('parses prCreateIncludeDefaultReviewers as boolean', () => {
    expect(
      parseSettableConfigValue('prCreateIncludeDefaultReviewers', 'true')
    ).toBe(true);
    expect(
      parseSettableConfigValue('prCreateIncludeDefaultReviewers', 'false')
    ).toBe(false);
    expect(() =>
      parseSettableConfigValue('prCreateIncludeDefaultReviewers', 'yes')
    ).toThrow("Invalid value for 'prCreateIncludeDefaultReviewers'");
  });

  it('throws BBError with VALIDATION_INVALID and context for invalid input', () => {
    try {
      parseSettableConfigValue('skipVersionCheck', 'nope');
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(err.context).toEqual({
        key: 'skipVersionCheck',
        value: 'nope',
      });
    }

    try {
      parseSettableConfigValue('versionCheckInterval', '0');
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID);
      expect(err.context).toEqual({
        key: 'versionCheckInterval',
        value: '0',
      });
    }
  });
});

describe('coerceBooleanConfigValue', () => {
  it('returns booleans unchanged', () => {
    expect(coerceBooleanConfigValue(true)).toBe(true);
    expect(coerceBooleanConfigValue(false)).toBe(false);
  });

  it('parses string literals case-insensitively', () => {
    expect(coerceBooleanConfigValue('true')).toBe(true);
    expect(coerceBooleanConfigValue('False')).toBe(false);
    expect(coerceBooleanConfigValue(' TRUE ')).toBe(true);
  });

  it('returns undefined for non-recognized values', () => {
    expect(coerceBooleanConfigValue(null)).toBeUndefined();
    expect(coerceBooleanConfigValue(undefined)).toBeUndefined();
    expect(coerceBooleanConfigValue(1)).toBeUndefined();
    expect(coerceBooleanConfigValue(0)).toBeUndefined();
    expect(coerceBooleanConfigValue('yes')).toBeUndefined();
    expect(coerceBooleanConfigValue({})).toBeUndefined();
  });
});

describe('coerceVersionCheckIntervalValue', () => {
  it('accepts positive safe integers', () => {
    expect(coerceVersionCheckIntervalValue(1)).toBe(1);
    expect(coerceVersionCheckIntervalValue(365)).toBe(365);
    expect(coerceVersionCheckIntervalValue(Number.MAX_SAFE_INTEGER)).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it('rejects non-positive, non-safe-integer, and non-numeric values', () => {
    expect(coerceVersionCheckIntervalValue(0)).toBeUndefined();
    expect(coerceVersionCheckIntervalValue(-1)).toBeUndefined();
    expect(coerceVersionCheckIntervalValue(1.5)).toBeUndefined();
    expect(coerceVersionCheckIntervalValue(Number.NaN)).toBeUndefined();
    expect(
      coerceVersionCheckIntervalValue(Number.POSITIVE_INFINITY)
    ).toBeUndefined();
    expect(coerceVersionCheckIntervalValue(null)).toBeUndefined();
    expect(coerceVersionCheckIntervalValue(true)).toBeUndefined();
  });

  it('parses positive integer strings', () => {
    expect(coerceVersionCheckIntervalValue('7')).toBe(7);
    expect(coerceVersionCheckIntervalValue('0')).toBeUndefined();
    expect(coerceVersionCheckIntervalValue('3.14')).toBeUndefined();
    expect(coerceVersionCheckIntervalValue('-5')).toBeUndefined();
  });
});

describe('coerceSkipVersionCheckValue', () => {
  it('is an alias for coerceBooleanConfigValue', () => {
    expect(coerceSkipVersionCheckValue).toBe(coerceBooleanConfigValue);
  });
});

describe('config key predicates', () => {
  it('isValidConfigKey recognizes every declared key', () => {
    for (const key of CONFIG_KEYS) {
      expect(isValidConfigKey(key)).toBe(true);
    }
    expect(isValidConfigKey('bogus')).toBe(false);
    expect(isValidConfigKey('')).toBe(false);
  });

  it('isSettableConfigKey only matches settable keys', () => {
    for (const key of SETTABLE_CONFIG_KEYS) {
      expect(isSettableConfigKey(key)).toBe(true);
    }
    // A read-only key like `username` should not be settable.
    expect(isSettableConfigKey('username')).toBe(false);
    expect(isSettableConfigKey('not-a-key')).toBe(false);
  });

  it('isReadableConfigKey only matches readable keys', () => {
    for (const key of READABLE_CONFIG_KEYS) {
      expect(isReadableConfigKey(key)).toBe(true);
    }
    // OAuth secrets should never be readable via `config get`.
    expect(isReadableConfigKey('apiToken')).toBe(false);
    expect(isReadableConfigKey('oauthAccessToken')).toBe(false);
    expect(isReadableConfigKey('oauthRefreshToken')).toBe(false);
  });
});
