import fs from 'node:fs';
import path from 'node:path';
import { BBError, ErrorCode } from '../types/errors.js';
import { parseFieldAssignment } from './api-passthrough.js';

export function buildMultipartForm(entries: readonly string[]): {
  form: FormData;
  bytes: number;
} {
  const form = new FormData();
  let bytes = 0;
  for (const entry of entries) {
    const { key, rawValue } = parseFieldAssignment(entry);
    if (!rawValue.startsWith('@') || rawValue.startsWith('@@')) {
      const value = rawValue.startsWith('@@') ? rawValue.slice(1) : rawValue;
      form.append(key, value);
      bytes += Buffer.byteLength(value);
      continue;
    }
    const filePath = rawValue.slice(1);
    if (!filePath || filePath === '-') {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message:
          '--form file values require @path; stdin (@-) is not supported.',
      });
    }
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `'${filePath}' is not a regular file.`,
        });
      }
      fs.accessSync(filePath, fs.constants.R_OK);
      // BunFile ignores the filename argument to append; File keeps only basename.
      form.append(key, new File([Bun.file(filePath)], path.basename(filePath)));
      bytes += stat.size;
    } catch (error) {
      if (error instanceof BBError) throw error;
      throw new BBError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Could not read file '${filePath}': ${error instanceof Error ? error.message : String(error)}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
  return { form, bytes };
}
