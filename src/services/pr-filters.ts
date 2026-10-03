/**
 * BBQL helpers for filtering pull requests server-side via the `q` parameter.
 */

import type { UsersApi } from '../generated/api.js';
import { BBError, ErrorCode } from '../types/errors.js';

export const CURRENT_USER = '@me';

export function bbqlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Resolve `@me`, an account ID or a `{uuid}` to the UUID that BBQL user
 * fields (`author.uuid`, `reviewers.uuid`) match on.
 */
export async function resolveUserUuid(
  usersApi: UsersApi,
  user: string
): Promise<string> {
  const response =
    user === CURRENT_USER
      ? await usersApi.userGet()
      : await usersApi.usersSelectedUserGet({ selectedUser: user });
  const uuid = response.data.uuid;

  if (!uuid) {
    throw new BBError({
      code: ErrorCode.API_REQUEST_FAILED,
      message: `Could not determine the UUID for user '${user}'.`,
      context: { user },
    });
  }

  return uuid;
}
