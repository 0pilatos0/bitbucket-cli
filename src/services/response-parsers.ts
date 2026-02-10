/**
 * Helpers for parsing loosely typed API responses.
 */

import type { PaginatedCollection } from './pagination.js';

type UnknownRecord = Record<string, unknown>;

export interface CloneLink {
  name: string;
  href: string;
}

export interface DiffstatFile {
  path: string;
  additions: number;
  deletions: number;
}

export interface ActivityUser {
  display_name?: string;
  username?: string;
  nickname?: string;
}

export interface PullrequestActivity {
  type?: string;
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
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function getIterable(value: unknown): Iterable<unknown> | undefined {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const iterableCandidate = value as { [Symbol.iterator]?: unknown };
  const iterator = iterableCandidate[Symbol.iterator];
  return typeof iterator === 'function'
    ? (value as unknown as Iterable<unknown>)
    : undefined;
}

function getValuesIterable(data: unknown): Iterable<unknown> | undefined {
  if (isRecord(data) && 'values' in data) {
    return getIterable(data.values);
  }

  return getIterable(data);
}

function mapPaginatedValues<T>(
  data: unknown,
  mapValue: (value: unknown) => T | undefined
): PaginatedCollection<T> {
  const iterableValues = getValuesIterable(data);
  const values: T[] = [];

  if (iterableValues) {
    for (const value of iterableValues) {
      const mappedValue = mapValue(value);
      if (mappedValue !== undefined) {
        values.push(mappedValue);
      }
    }
  }

  const next = isRecord(data) ? getString(data.next) : undefined;

  return {
    values,
    next,
  };
}

function getCommitFilePath(file: unknown): string | undefined {
  if (!isRecord(file)) {
    return undefined;
  }

  const path = file.path;
  return typeof path === 'string' && path.length > 0 ? path : undefined;
}

function parseDiffstatFile(value: unknown): DiffstatFile | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    path:
      getCommitFilePath(value.new) ?? getCommitFilePath(value.old) ?? 'unknown',
    additions: getNumber(value.lines_added) ?? 0,
    deletions: getNumber(value.lines_removed) ?? 0,
  };
}

function parseActivityUser(value: unknown): ActivityUser | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const displayName = getString(value.display_name);
  const username = getString(value.username);
  const nickname = getString(value.nickname);

  if (!displayName && !username && !nickname) {
    return undefined;
  }

  return {
    display_name: displayName,
    username,
    nickname,
  };
}

function parseActivityHash(value: unknown): { hash?: string } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const hash = getString(value.hash);
  return hash ? { hash } : undefined;
}

function parseActivityComment(
  value: unknown
): PullrequestActivity['comment'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getNumber(value.id);
  const raw = getRawContent(value.content);
  const user = parseActivityUser(value.user);
  const author = parseActivityUser(value.author);
  const createdOn = getString(value.created_on);

  if (id === undefined && raw === undefined && !user && !author && !createdOn) {
    return undefined;
  }

  return {
    id,
    content: raw === undefined ? undefined : { raw },
    user,
    author,
    created_on: createdOn,
  };
}

function parseApproval(
  value: unknown
): PullrequestActivity['approval'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const user = parseActivityUser(value.user);
  const date = getString(value.date);

  if (!user && !date) {
    return undefined;
  }

  return { user, date };
}

function parseChangesRequested(
  value: unknown
): PullrequestActivity['changes_requested'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const user = parseActivityUser(value.user);
  const reason = getString(value.reason);
  const date = getString(value.date);

  if (!user && !reason && !date) {
    return undefined;
  }

  return {
    user,
    reason,
    date,
  };
}

function parseMerge(value: unknown): PullrequestActivity['merge'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const user = parseActivityUser(value.user);
  const date = getString(value.date);
  const commit = parseActivityHash(value.commit);

  if (!user && !date && !commit) {
    return undefined;
  }

  return {
    user,
    date,
    commit,
  };
}

function parseDecline(
  value: unknown
): PullrequestActivity['decline'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const user = parseActivityUser(value.user);
  const date = getString(value.date);

  if (!user && !date) {
    return undefined;
  }

  return { user, date };
}

function parseCommit(
  value: unknown
): PullrequestActivity['commit'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const date = getString(value.date);
  const hash = getString(value.hash);
  const author = isRecord(value.author)
    ? {
        user: parseActivityUser(value.author.user),
      }
    : undefined;

  if (!date && !hash && !author?.user) {
    return undefined;
  }

  return {
    date,
    hash,
    author,
  };
}

function parseUpdate(
  value: unknown
): PullrequestActivity['update'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const author = parseActivityUser(value.author);
  const date = getString(value.date);
  const title = getString(value.title);
  const description = getString(value.description);
  const state = getString(value.state);

  if (!author && !date && !title && !description && !state) {
    return undefined;
  }

  return {
    author,
    date,
    title,
    description,
    state,
  };
}

function parseActivity(value: unknown): PullrequestActivity | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    type: getString(value.type),
    comment: parseActivityComment(value.comment),
    approval: parseApproval(value.approval),
    changes_requested: parseChangesRequested(value.changes_requested),
    merge: parseMerge(value.merge),
    decline: parseDecline(value.decline),
    commit: parseCommit(value.commit),
    update: parseUpdate(value.update),
    user: parseActivityUser(value.user),
  };
}

export function getLinkHref(links: unknown, key: string): string | undefined {
  if (!isRecord(links)) {
    return undefined;
  }

  const link = links[key];
  if (!isRecord(link)) {
    return undefined;
  }

  return getString(link.href);
}

export function getCloneLinks(links: unknown): CloneLink[] {
  if (!isRecord(links)) {
    return [];
  }

  const cloneLinks = getIterable(links.clone);
  if (!cloneLinks) {
    return [];
  }

  const parsedLinks: CloneLink[] = [];

  for (const cloneLink of cloneLinks) {
    if (!isRecord(cloneLink)) {
      continue;
    }

    const name = getString(cloneLink.name);
    const href = getString(cloneLink.href);
    if (name && href) {
      parsedLinks.push({ name, href });
    }
  }

  return parsedLinks;
}

export function getBranchName(endpoint: unknown): string | undefined {
  if (!isRecord(endpoint)) {
    return undefined;
  }

  const branch = endpoint.branch;
  if (!isRecord(branch)) {
    return undefined;
  }

  const name = branch.name;
  return typeof name === 'string' && name.length > 0 ? name : undefined;
}

export function getUserDisplayName(user: unknown): string | undefined {
  if (!isRecord(user)) {
    return undefined;
  }

  const nickname = getString(user.nickname);
  if (nickname && nickname.length > 0) {
    return nickname;
  }

  const displayName = getString(user.display_name);
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  const username = getString(user.username);
  return username && username.length > 0 ? username : undefined;
}

export function getRawContent(content: unknown): string | undefined {
  if (!isRecord(content)) {
    return undefined;
  }

  return getString(content.raw);
}

export function parseDiffstatFiles(data: unknown): DiffstatFile[] {
  return Array.from(mapPaginatedValues(data, parseDiffstatFile).values ?? []);
}

export function parsePullrequestActivitiesPage(
  data: unknown
): PaginatedCollection<PullrequestActivity> {
  return mapPaginatedValues(data, parseActivity);
}
