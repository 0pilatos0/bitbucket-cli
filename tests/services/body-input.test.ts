/**
 * --body-file helper tests
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readBodyFile,
  resolveBodyInput,
  resolveCommentText,
} from '../../src/services/body-input.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bb-body-input-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const noStdin = async (): Promise<string> => {
  throw new Error('stdin should not be read');
};

const MARKDOWN = '## Summary\n\nRun `bun test` and check "$HOME".\n';

async function catchError(promise: Promise<unknown>): Promise<BBError> {
  try {
    await promise;
  } catch (error) {
    return error as BBError;
  }
  throw new Error('expected a rejection');
}

describe('readBodyFile', () => {
  it('returns the file content untouched', async () => {
    const path = join(dir, 'body.md');
    await writeFile(path, MARKDOWN);

    expect(await readBodyFile(path, noStdin)).toBe(MARKDOWN);
  });

  it('reads stdin for -', async () => {
    expect(await readBodyFile('-', async () => MARKDOWN)).toBe(MARKDOWN);
  });

  it('reports a missing file as FILE_NOT_FOUND with the path', async () => {
    const path = join(dir, 'missing.md');
    const error = await catchError(readBodyFile(path, noStdin));

    expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(error.message).toContain(`Failed to read file '${path}'`);
    expect(error.context).toEqual({ bodyFile: path });
  });

  it('reports other read failures as UNKNOWN', async () => {
    const error = await catchError(readBodyFile(dir, noStdin));

    expect(error.code).toBe(ErrorCode.UNKNOWN);
    expect(error.context).toEqual({ bodyFile: dir });
  });
});

describe('resolveBodyInput', () => {
  it('returns the inline value when no file is given', async () => {
    expect(
      await resolveBodyInput({
        inline: 'inline',
        inlineLabel: '--body',
        bodyFile: undefined,
        readStdin: noStdin,
      })
    ).toBe('inline');
  });

  it('reads the file when only --body-file is given', async () => {
    expect(
      await resolveBodyInput({
        inline: undefined,
        inlineLabel: '--body',
        bodyFile: '-',
        readStdin: async () => MARKDOWN,
      })
    ).toBe(MARKDOWN);
  });

  it('rejects the inline value together with --body-file', async () => {
    const error = await catchError(
      resolveBodyInput({
        inline: 'inline',
        inlineLabel: '--body',
        bodyFile: '-',
        readStdin: noStdin,
      })
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(error.message).toBe(
      'Cannot combine --body with --body-file. Pass one or the other.'
    );
  });
});

describe('resolveCommentText', () => {
  it('requires a message or --body-file', async () => {
    const error = await catchError(
      resolveCommentText(undefined, undefined, noStdin)
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_REQUIRED);
    expect(error.message).toContain('Comment text is required');
  });

  it('rejects a blank --body-file', async () => {
    const error = await catchError(
      resolveCommentText(undefined, '-', async () => ' \n')
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_REQUIRED);
    expect(error.message).toBe("Comment text from --body-file '-' is empty.");
  });

  it('names the message argument when combined with --body-file', async () => {
    const error = await catchError(resolveCommentText('hi', '-', noStdin));

    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(error.message).toContain('the <message> argument');
  });
});
