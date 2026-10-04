/**
 * Shared `-F/--body-file` handling for commands that send markdown text
 * (`bb pr create`, `bb pr edit`, `bb pr comments add/reply`).
 */

import * as fs from 'node:fs';
import { BBError, ErrorCode } from '../types/errors.js';

/**
 * Read `--body-file`: a file path, or stdin when `source` is `-`. The text is
 * returned as-is so markdown keeps its exact formatting.
 */
export async function readBodyFile(
  source: string,
  readStdin: () => Promise<string>
): Promise<string> {
  if (source === '-') {
    return readStdin();
  }
  try {
    return fs.readFileSync(source, 'utf-8');
  } catch (err) {
    const isNotFound =
      err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT';
    throw new BBError({
      code: isNotFound ? ErrorCode.FILE_NOT_FOUND : ErrorCode.UNKNOWN,
      message: `Failed to read file '${source}': ${err instanceof Error ? err.message : 'Unknown error'}`,
      cause: err instanceof Error ? err : undefined,
      context: { bodyFile: source },
    });
  }
}

/**
 * Take the text from either the inline value or `--body-file`. Passing both
 * is rejected so a stray argument never silently replaces the file.
 */
export async function resolveBodyInput(input: {
  inline: string | undefined;
  inlineLabel: string;
  bodyFile: string | undefined;
  readStdin: () => Promise<string>;
}): Promise<string | undefined> {
  if (input.bodyFile === undefined) {
    return input.inline;
  }
  if (input.inline !== undefined) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: `Cannot combine ${input.inlineLabel} with --body-file. Pass one or the other.`,
    });
  }
  return readBodyFile(input.bodyFile, input.readStdin);
}

/** Comment text from the `<message>` argument or `--body-file`; never blank. */
export async function resolveCommentText(
  message: string | undefined,
  bodyFile: string | undefined,
  readStdin: () => Promise<string>
): Promise<string> {
  const text = await resolveBodyInput({
    inline: message,
    inlineLabel: 'the <message> argument',
    bodyFile,
    readStdin,
  });
  if (!text?.trim()) {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message:
        bodyFile === undefined
          ? 'Comment text is required. Pass it as <message> or with -F/--body-file.'
          : `Comment text from --body-file '${bodyFile}' is empty.`,
    });
  }
  return text;
}
