/**
 * Shared helpers for commit commands
 */

import type { BaseCommit } from '../../generated/api.js';

/** Short (7-character) form of a commit hash, the git CLI convention. */
export function shortHash(hash: string | undefined): string {
  return hash ? hash.slice(0, 7) : '-';
}

/** First line of a commit message, for table rendering. */
export function firstMessageLine(message: string | undefined): string {
  if (!message) {
    return '-';
  }
  const newline = message.indexOf('\n');
  return newline === -1 ? message : message.slice(0, newline);
}

/**
 * Human-readable author name. Prefers the matched Bitbucket account's display
 * name; otherwise parses the raw git author string ("Name <email>") down to
 * the name part so tables stay compact.
 */
export function formatAuthor(author: BaseCommit['author']): string {
  const displayName = author?.user?.display_name;
  if (displayName) {
    return displayName;
  }
  const raw = author?.raw;
  if (!raw) {
    return '-';
  }
  const emailStart = raw.indexOf('<');
  const name = emailStart === -1 ? raw : raw.slice(0, emailStart);
  return name.trim() || raw;
}
