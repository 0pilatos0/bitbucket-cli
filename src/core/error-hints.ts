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

import { APIError } from '../types/errors.js';

export const DOCS_BASE_URL = 'https://bitbucket-cli.paulvanderlei.com';

/**
 * Wording is lifted from `docs/src/content/docs/reference/error-codes.mdx`
 * (codes 1002 / 2002 / 2003) so the CLI and the docs cannot drift. Exported
 * so a future drift-check script can assert each line appears verbatim in the
 * docs, following the existing `scripts/check-*-docs.ts` pattern.
 */
export const REMEDIATION_HINTS: Readonly<Record<number, readonly string[]>> = {
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
 * 404 is suppressed in two cases, or the hint would be noise on the paths
 * users hit most:
 *
 * - the message was already rewritten to name the missing resource by one of
 *   the `rethrow*` helpers (`error.contextualized`), and
 * - `bb api`, where the user typed the URL themselves so `--workspace`/`--repo`
 *   were never involved.
 */
export function remediationHintLines(
  error: unknown,
  opts: { commandPath?: string } = {}
): string[] {
  if (!(error instanceof APIError)) return [];

  if (error.statusCode === 404) {
    if (error.contextualized) return [];
    if (opts.commandPath === 'api') return [];
  }

  return [...(REMEDIATION_HINTS[error.statusCode] ?? [])];
}
