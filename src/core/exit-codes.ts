/**
 * Process exit statuses. Every failure exits 1 unless `BB_DETAILED_EXIT_CODES`
 * is set, which opts into a status per failure class so scripts can branch
 * without parsing stderr. Opt-in because existing scripts may compare `$?`
 * against 1. Ctrl+C at a prompt exits 130 in both modes.
 */

import { BBError, ErrorCode } from '../types/errors.js';

export const ExitCode = {
  FAILURE: 1,
  USAGE: 2,
  NOT_FOUND: 3,
  AUTH: 4,
  CONFIRMATION_REQUIRED: 5,
  INTERRUPTED: 130,
} as const;

const DETAILED_EXIT_CODES: ReadonlyMap<ErrorCode, number> = new Map([
  [ErrorCode.AUTH_REQUIRED, ExitCode.AUTH],
  [ErrorCode.AUTH_INVALID, ExitCode.AUTH],
  [ErrorCode.AUTH_EXPIRED, ExitCode.AUTH],
  [ErrorCode.API_NOT_FOUND, ExitCode.NOT_FOUND],
  [ErrorCode.CONFIG_INVALID_KEY, ExitCode.USAGE],
  [ErrorCode.VALIDATION_REQUIRED, ExitCode.USAGE],
  [ErrorCode.VALIDATION_INVALID, ExitCode.USAGE],
  [ErrorCode.FILE_NOT_FOUND, ExitCode.USAGE],
  [ErrorCode.CONTEXT_REPO_NOT_FOUND, ExitCode.USAGE],
  [ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND, ExitCode.USAGE],
  [ErrorCode.JSON_FORMAT_INVALID, ExitCode.USAGE],
  [ErrorCode.CONFIRMATION_REQUIRED, ExitCode.CONFIRMATION_REQUIRED],
]);

export function detailedExitCodesEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const value = env.BB_DETAILED_EXIT_CODES;
  return value !== undefined && value !== '';
}

/** Exit status for a failure carrying `code` (absent for non-BBErrors). */
export function exitCodeFor(
  code: ErrorCode | undefined,
  env: NodeJS.ProcessEnv = process.env
): number {
  if (code === undefined || !detailedExitCodesEnabled(env)) {
    return ExitCode.FAILURE;
  }
  return DETAILED_EXIT_CODES.get(code) ?? ExitCode.FAILURE;
}

/** Exit status for an error thrown out of a command. */
export function exitCodeForError(
  error: unknown,
  env: NodeJS.ProcessEnv = process.env
): number {
  if (!(error instanceof BBError)) return ExitCode.FAILURE;
  if (
    error.code === ErrorCode.PROMPT_CANCELLED &&
    error.context?.interrupted === true
  ) {
    return ExitCode.INTERRUPTED;
  }
  return exitCodeFor(error.code, env);
}
