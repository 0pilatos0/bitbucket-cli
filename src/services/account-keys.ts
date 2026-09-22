/**
 * Shared helpers for the `bb ssh-key` and `bb gpg-key` command groups, which
 * both manage keys on the authenticated account via
 * `/users/{selected_user}/...`.
 */

import * as fs from 'node:fs';
import type { UsersApi } from '../generated/api.js';
import { BBError, ErrorCode } from '../types/errors.js';

/**
 * Resolve the authenticated account's UUID for the `{selected_user}` path
 * segment. Bitbucket has no `me` alias there, so `GET /user` comes first.
 */
export async function resolveCurrentUserUuid(
  usersApi: UsersApi
): Promise<string> {
  const response = await usersApi.userGet();
  const uuid = response.data.uuid;
  if (!uuid) {
    throw new BBError({
      code: ErrorCode.API_REQUEST_FAILED,
      message: 'Could not determine your account UUID from GET /user.',
    });
  }
  return uuid;
}

/**
 * Read a public key from a file path, or from stdin when `source` is `-`.
 * Surrounding whitespace is trimmed; an empty key is rejected before any
 * network call.
 */
export async function readPublicKey(
  source: string,
  readStdin: () => Promise<string>
): Promise<string> {
  let raw: string;
  if (source === '-') {
    raw = await readStdin();
  } else {
    try {
      raw = fs.readFileSync(source, 'utf8');
    } catch (error) {
      const reason = error instanceof Error ? `: ${error.message}` : '';
      throw new BBError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Could not read key file '${source}'${reason}`,
        cause: error instanceof Error ? error : undefined,
        context: { path: source },
      });
    }
  }

  const key = raw.trim();
  if (key === '') {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message:
        source === '-'
          ? 'No key found on stdin.'
          : `Key file '${source}' is empty.`,
    });
  }
  return key;
}
