import { describe, it, expect } from 'bun:test';
import {
  ExitCode,
  exitCodeFor,
  exitCodeForError,
} from '../../src/core/exit-codes.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';

const DETAILED = { BB_DETAILED_EXIT_CODES: '1' };

describe('exitCodeFor', () => {
  it('exits 1 for every code unless detailed exit codes are enabled', () => {
    for (const code of [
      ErrorCode.AUTH_REQUIRED,
      ErrorCode.API_NOT_FOUND,
      ErrorCode.VALIDATION_INVALID,
      ErrorCode.CONFIRMATION_REQUIRED,
    ]) {
      expect(exitCodeFor(code, {})).toBe(1);
      expect(exitCodeFor(code, { BB_DETAILED_EXIT_CODES: '' })).toBe(1);
    }
  });

  it('maps failure classes to their documented status when enabled', () => {
    expect(exitCodeFor(ErrorCode.VALIDATION_REQUIRED, DETAILED)).toBe(2);
    expect(exitCodeFor(ErrorCode.VALIDATION_INVALID, DETAILED)).toBe(2);
    expect(exitCodeFor(ErrorCode.JSON_FORMAT_INVALID, DETAILED)).toBe(2);
    expect(exitCodeFor(ErrorCode.CONTEXT_REPO_NOT_FOUND, DETAILED)).toBe(2);
    expect(exitCodeFor(ErrorCode.API_NOT_FOUND, DETAILED)).toBe(3);
    expect(exitCodeFor(ErrorCode.AUTH_REQUIRED, DETAILED)).toBe(4);
    expect(exitCodeFor(ErrorCode.AUTH_INVALID, DETAILED)).toBe(4);
    expect(exitCodeFor(ErrorCode.AUTH_EXPIRED, DETAILED)).toBe(4);
    expect(exitCodeFor(ErrorCode.CONFIRMATION_REQUIRED, DETAILED)).toBe(5);
  });

  it('falls back to 1 for unmapped codes', () => {
    expect(exitCodeFor(ErrorCode.API_FORBIDDEN, DETAILED)).toBe(1);
    expect(exitCodeFor(ErrorCode.NETWORK_ERROR, DETAILED)).toBe(1);
    expect(exitCodeFor(ErrorCode.UNKNOWN, DETAILED)).toBe(1);
    expect(exitCodeFor(undefined, DETAILED)).toBe(1);
  });
});

describe('exitCodeForError', () => {
  it('exits 130 after Ctrl+C at a prompt in both modes', () => {
    const interrupted = new BBError({
      code: ErrorCode.PROMPT_CANCELLED,
      message: 'Prompt cancelled.',
      context: { interrupted: true },
    });
    expect(exitCodeForError(interrupted, {})).toBe(ExitCode.INTERRUPTED);
    expect(exitCodeForError(interrupted, DETAILED)).toBe(ExitCode.INTERRUPTED);
  });

  it('exits 1 for a declined confirmation', () => {
    const declined = new BBError({
      code: ErrorCode.PROMPT_CANCELLED,
      message: 'Cancelled.',
    });
    expect(exitCodeForError(declined, DETAILED)).toBe(1);
  });

  it('uses the code carried by an APIError', () => {
    expect(exitCodeForError(new APIError('gone', 404), DETAILED)).toBe(3);
  });

  it('exits 1 for non-BBError values', () => {
    expect(exitCodeForError(new Error('boom'), DETAILED)).toBe(1);
    expect(exitCodeForError('boom', DETAILED)).toBe(1);
  });
});
