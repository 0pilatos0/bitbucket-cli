/**
 * Shared helpers for commit-status commands
 */

import type { IOutputService } from '../../core/interfaces/services.js';
import { CommitstatusStateEnum } from '../../generated/api.js';

/** All valid commit-status states, single-sourced from the generated enum. */
export const COMMIT_STATUS_STATES = Object.values(
  CommitstatusStateEnum
) as readonly string[];

/**
 * Color a commit-status state the same way `bb pr checks` renders build
 * states: green for success, red for failure, yellow for in-progress, gray
 * for stopped/unknown.
 */
export function colorStatusState(
  output: IOutputService,
  state: string | undefined
): string {
  switch (state?.toUpperCase()) {
    case 'SUCCESSFUL':
      return output.green(state ?? '');
    case 'FAILED':
      return output.red(state ?? '');
    case 'INPROGRESS':
      return output.yellow(state ?? '');
    case 'STOPPED':
      return output.gray(state ?? '');
    default:
      return output.gray(state ?? '-');
  }
}
