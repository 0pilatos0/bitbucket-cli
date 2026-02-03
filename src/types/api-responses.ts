import { isObject, toArray } from './api-helpers.js';

export interface ActivityUser {
  display_name?: string;
  username?: string;
  nickname?: string;
}

export interface PullrequestActivity {
  comment?: {
    id?: number;
    content?: { raw?: string };
    user?: ActivityUser;
    author?: ActivityUser;
    created_on?: string;
  };
  approval?: { user?: ActivityUser; date?: string };
  changes_requested?: { user?: ActivityUser; reason?: string; date?: string };
  merge?: { user?: ActivityUser; date?: string; commit?: { hash?: string } };
  decline?: { user?: ActivityUser; date?: string };
  commit?: { author?: { user?: ActivityUser }; date?: string; hash?: string };
  update?: {
    author?: ActivityUser;
    date?: string;
    title?: string;
    description?: string;
    state?: string;
  };
  user?: ActivityUser;
  type?: string;
}

export interface DiffstatEntry {
  lines_added?: number;
  lines_removed?: number;
  old?: { path?: string };
  new?: { path?: string };
}

const getIterableValues = <T>(data: unknown): Iterable<T> | undefined => {
  if (!isObject(data)) {
    return undefined;
  }

  const values = data.values;
  if (!isObject(values)) {
    return undefined;
  }

  return Symbol.iterator in values ? (values as Iterable<T>) : undefined;
};

export const parsePullrequestActivities = (
  data: unknown
): PullrequestActivity[] => {
  return toArray(getIterableValues<PullrequestActivity>(data));
};

export const parseDiffstats = (data: unknown): DiffstatEntry[] => {
  return toArray(getIterableValues<DiffstatEntry>(data));
};

export const parseDiffResponse = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }

  return String(data ?? '');
};
