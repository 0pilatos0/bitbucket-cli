/**
 * Configuration types with validation
 */

export interface BBConfig {
  username?: string;
  apiToken?: string;
  defaultWorkspace?: string;
  lastVersionCheck?: string;
  skipVersionCheck?: boolean;
  versionCheckInterval?: number;
  userUuid?: string;
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
  workspace?: string;
  repo?: string;
}

export const CONFIG_KEYS = [
  'username',
  'apiToken',
  'defaultWorkspace',
  'lastVersionCheck',
  'skipVersionCheck',
  'versionCheckInterval',
  'userUuid',
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
