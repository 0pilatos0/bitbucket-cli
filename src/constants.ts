/**
 * Application constants
 */

/**
 * Origin of the published documentation site, used when an error or help
 * footer points the user at a docs page.
 *
 * NOTE: `src/cli.ts` and `src/services/oauth.service.ts` still hardcode this
 * origin in 11 places (help-text `seeAlso` blocks and OAuth copy). Adopting
 * this constant there is a mechanical follow-up, deliberately left out of the
 * change that introduced it to keep the diff reviewable.
 */
export const DOCS_BASE_URL = 'https://bitbucket-cli.paulvanderlei.com';

/**
 * Bitbucket Cloud API pagination limits
 *
 * Reference: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pullrequests/
 *
 * Different endpoints have different maximum pagelen values:
 * - Pull requests: maximum 50
 * - Repositories: maximum 100
 *
 * These limits are enforced by Bitbucket API and will return
 * "Invalid pagelen" error if exceeded.
 */
export const API_PAGELEN_LIMITS = {
  PULL_REQUESTS: 50,
  REPOSITORIES: 100,
} as const;

export const DEFAULT_PAGELEN = {
  PULL_REQUESTS: 25,
  REPOSITORIES: 25,
} as const;
