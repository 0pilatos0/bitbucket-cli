/**
 * Shared helpers for the `bb issue` command group.
 *
 * Bitbucket Cloud's issue tracker is opt-in per repository: when it is
 * disabled the API answers 404 on every `/issues` endpoint, which is easy to
 * misread as "repo not found". The rethrow helpers here turn those 404s into
 * actionable messages once, so every issue command reports them the same way.
 */

import type { Account, Issue, IssueComment } from '../../generated/api.js';
import {
  IssueKindEnum,
  IssuePriorityEnum,
  IssueStateEnum,
} from '../../generated/api.js';
import { getUserDisplayName } from '../../services/response-parsers.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

/**
 * CLI-facing state names. The API spells the on-hold state with a space
 * (`"on hold"`); the CLI takes the dash form so it works unquoted in shells.
 */
export const ISSUE_STATES: readonly string[] = Object.values(
  IssueStateEnum
).map((state) => state.replace(' ', '-'));

export const ISSUE_KINDS: readonly string[] = Object.values(IssueKindEnum);

export const ISSUE_PRIORITIES: readonly string[] =
  Object.values(IssuePriorityEnum);

/** Build the request body for a new issue comment. */
export function buildIssueComment(message: string): IssueComment {
  return {
    type: 'issue_comment',
    content: { raw: message },
  };
}

/** Issues are listed most recently updated first, mirroring `gh issue list`. */
export const DEFAULT_ISSUE_SORT = '-updated_on';

/** Map a CLI state value (`on-hold`) back to the API spelling (`on hold`). */
export function cliStateToApi(state: string): string {
  return state.replace('-', ' ');
}

/**
 * Quote a value for a Bitbucket `q` filter expression, escaping backslashes
 * and embedded double quotes so user input cannot break out of the literal.
 */
export function quoteQueryValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Default `q` clause when no `--state` / `--query` is given: show issues that
 * still need attention, mirroring `gh issue list` defaulting to open issues.
 * Parenthesized so it composes with `AND` clauses from other filters.
 */
export const DEFAULT_OPEN_STATES_CLAUSE = '(state="new" OR state="open")';

const TRACKER_DISABLED_MESSAGE =
  "This repository's issue tracker is disabled (or the repo was not found). " +
  'Enable it under Repository settings → Issue tracker on Bitbucket, or ' +
  'check --workspace/--repo. Many teams use Jira instead — see the docs.';

/**
 * Rethrow helper for the COLLECTION endpoints (`bb issue list` / `bb issue
 * create`): a 404 there almost always means the tracker is disabled, not
 * that an individual resource is missing.
 */
export function rethrowTrackerDisabled(error: unknown): never {
  rethrowWithNotFoundContext(error, TRACKER_DISABLED_MESSAGE);
}

/**
 * Rethrow helper for the id-specific endpoints (`view` / `edit` / `close` /
 * `comment`): prefer "issue not found", but mention the tracker-disabled
 * possibility because a disabled tracker 404s identically.
 */
export function rethrowIssueNotFound(
  error: unknown,
  issueId: string,
  workspace: string,
  repoSlug: string
): never {
  rethrowWithNotFoundContext(
    error,
    `Issue #${issueId} not found in ${workspace}/${repoSlug}. ` +
      "If no issues exist at all, the repository's issue tracker may be " +
      'disabled (Repository settings → Issue tracker).'
  );
}

/** Display name for an issue's assignee/reporter, `-` when unset. */
export function formatIssueUser(user: Account | undefined): string {
  return getUserDisplayName(user) ?? '-';
}

/**
 * Build the assignee body fragment for create/edit. The generated `Account`
 * model no longer carries `username`, but the issue-tracker write endpoints
 * still accept (and require) it for assignment, so the cast bridges the
 * spec gap.
 */
export function assigneeBody(username: string): Account {
  return { type: 'user', username } as Account;
}

/** Issue body shape sent on create/edit (partial on edit). */
export type IssueChanges = Partial<Issue> & { type: 'issue' };
