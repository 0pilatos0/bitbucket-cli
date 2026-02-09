/**
 * Configuration types with validation
 */

import { BBError, ErrorCode } from './errors.js';

export interface BBConfig {
  username?: string;
  apiToken?: string;
  defaultWorkspace?: string;
  lastVersionCheck?: string;
  skipVersionCheck?: boolean;
  versionCheckInterval?: number;
}

export interface AuthCredentials {
  username: string;
  apiToken: string;
}

export interface RepoContext {
  workspace: string;
  repoSlug: string;
}

export interface GlobalOptions {
  json?: boolean;
  noColor?: boolean;
  workspace?: string;
  repo?: string;
}

type ReadableConfigValue = string | number | boolean;

export const CONFIG_KEYS = [
  'username',
  'apiToken',
  'defaultWorkspace',
  'lastVersionCheck',
  'skipVersionCheck',
  'versionCheckInterval',
] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];

export const SETTABLE_CONFIG_KEYS = [
  'defaultWorkspace',
  'skipVersionCheck',
  'versionCheckInterval',
] as const;
export type SettableConfigKey = (typeof SETTABLE_CONFIG_KEYS)[number];

export const READABLE_CONFIG_KEYS = [
  'username',
  'defaultWorkspace',
  'skipVersionCheck',
  'versionCheckInterval',
] as const;
export type ReadableConfigKey = (typeof READABLE_CONFIG_KEYS)[number];

export function isValidConfigKey(key: string): key is ConfigKey {
  return CONFIG_KEYS.includes(key as ConfigKey);
}

export function isSettableConfigKey(key: string): key is SettableConfigKey {
  return SETTABLE_CONFIG_KEYS.includes(key as SettableConfigKey);
}

export function isReadableConfigKey(key: string): key is ReadableConfigKey {
  return READABLE_CONFIG_KEYS.includes(key as ReadableConfigKey);
}

function parseBooleanLiteral(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

function parsePositiveIntegerLiteral(value: string): number | undefined {
  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

export function parseSettableConfigValue<K extends SettableConfigKey>(
  key: K,
  value: string
): BBConfig[K] {
  switch (key) {
    case 'defaultWorkspace':
      return value as BBConfig[K];
    case 'skipVersionCheck': {
      const parsed = parseBooleanLiteral(value);
      if (parsed === undefined) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message:
            "Invalid value for 'skipVersionCheck'. Expected 'true' or 'false'.",
          context: { key, value },
        });
      }
      return parsed as BBConfig[K];
    }
    case 'versionCheckInterval': {
      const parsed = parsePositiveIntegerLiteral(value);
      if (parsed === undefined) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message:
            "Invalid value for 'versionCheckInterval'. Expected a positive integer (1 or greater).",
          context: { key, value },
        });
      }
      return parsed as BBConfig[K];
    }
  }
}

export function coerceSkipVersionCheckValue(
  value: unknown
): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return parseBooleanLiteral(value);
  }

  return undefined;
}

export function coerceVersionCheckIntervalValue(
  value: unknown
): number | undefined {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 1) {
      return undefined;
    }

    return value;
  }

  if (typeof value === 'string') {
    return parsePositiveIntegerLiteral(value);
  }

  return undefined;
}

export function normalizeReadableConfigValue(
  key: ReadableConfigKey,
  value: unknown
): ReadableConfigValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  switch (key) {
    case 'skipVersionCheck':
      return coerceSkipVersionCheckValue(value);
    case 'versionCheckInterval':
      return coerceVersionCheckIntervalValue(value);
    case 'username':
    case 'defaultWorkspace':
      return typeof value === 'string' ? value : undefined;
  }
}
