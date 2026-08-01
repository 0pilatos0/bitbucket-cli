/**
 * Actionable "what do I do now" lines appended to auth/permission/not-found
 * failures, so an error tells the user their next step instead of only what
 * went wrong.
 *
 * Gating is on `APIError.statusCode`, never on `ErrorCode`. The two are not
 * interchangeable: several commands throw a plain `BBError` carrying
 * `API_NOT_FOUND` for conditions that have nothing to do with a wrong
 * workspace/repo (a missing PR source branch, an absent diff, a pipeline
 * without logs), and stapling resource advice onto those would be wrong.
 * Keying on the HTTP status also keeps us clear of the auth paths that
 * already carry their own remediation (`AUTH_REQUIRED` thrown before any
 * request is made, `AUTH_EXPIRED` from the OAuth refresh path, and the
 * `bb auth login` / `bb auth status` errors).
 */

import { APIError, ContextualizedAPIError } from '../types/errors.js';
import { DOCS_BASE_URL } from '../constants.js';

/**
 * Wording is lifted from `docs/src/content/docs/reference/error-codes.mdx`
 * (codes 1002 / 2002 / 2003) so the CLI and the docs cannot drift.
 *
 * `number` keys rather than a `401 | 403 | 404` union: the lookup is by
 * `error.statusCode`, which is a plain `number`. `noUncheckedIndexedAccess`
 * makes the miss explicit at the call site.
 */
const REMEDIATION_HINTS: Record<number, readonly string[]> = {
  401: [
    'Your Bitbucket credentials were rejected. Run `bb auth login` to re-authenticate.',
  ],
  403: [
    "Your token may be missing a required scope. Scopes can't be added to an " +
      'existing token — mint a new one, then run `bb auth login`.',
    `Docs: ${DOCS_BASE_URL}/reference/token-scopes/`,
  ],
  404: [
    'Verify the id or slug you passed, and that --workspace/--repo point at ' +
      'the right repository your token can see.',
  ],
};

/**
 * The remediation lines for `error`, or an empty array when there is nothing
 * useful to add. Callers append unconditionally.
 *
 * The generic 404 advice is skipped in two cases, or it would be noise on the
 * paths users hit most: when the message already names the missing resource
 * (a {@link ContextualizedAPIError}), and when the command opts out via
 * `suppressNotFoundHint` because the user supplied the URL themselves.
 */
export function remediationHintLines(
  error: unknown,
  opts: { suppressNotFoundHint?: boolean } = {}
): string[] {
  if (!(error instanceof APIError)) return [];

  if (error.statusCode === 404) {
    if (error instanceof ContextualizedAPIError) return [];
    if (opts.suppressNotFoundHint) return [];
  }

  return [...(REMEDIATION_HINTS[error.statusCode] ?? [])];
}
