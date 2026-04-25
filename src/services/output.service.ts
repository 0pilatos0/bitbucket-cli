/**
 * Output service for formatted console output
 */

import chalk from 'chalk';
import type {
  IOutputService,
  JsonFormatOptions,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import { projectFields } from './output.project.js';

// Strip dangerous terminal control sequences from text before printing so
// attacker-controlled API data (PR titles, descriptions, branch names,
// snippet names, etc.) can't spoof clickable hyperlinks (OSC-8), rewrite the
// terminal title (OSC-0), clear the screen, or trigger legacy escape-handling
// vulnerabilities. SGR sequences (CSI ending in 'm') are preserved via the
// first capture group so chalk-generated color/style codes composed by
// callers — e.g. `output.text(`${output.bold('#42')} ${pr.title}`)` — still
// render. JSON output is intentionally unchanged: JSON encoding escapes
// control characters, so machine-readable consumers see the raw bytes.
const CONTROL_CHARS =
  // eslint-disable-next-line no-control-regex
  /(\x1b\[[0-9;?]*m)|\x1b\[[0-9;?]*[A-Za-ln-z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x9B\x9D]/g;

function stripControl(value: string): string {
  return value.replace(
    CONTROL_CHARS,
    (_match, sgr: string | undefined) => sgr ?? ''
  );
}

// Wrapper objects produced by list-style commands have a single canonical
// "items" key. When `--json fields` is passed, project across that array
// instead of the wrapper. Order matters: the first match wins. Keys must
// match the actual JSON output produced by the commands in src/commands/**.
const WRAPPER_ARRAY_KEYS: readonly string[] = [
  'pullRequests', // pr list
  'repositories', // repo list
  'snippets', // snippet list
  'comments', // pr comments list, snippet comments list
  'reviewers', // pr reviewers list, repo default-reviewers list
  'activities', // pr activity
  'statuses', // pr checks
  'files', // pr diff --stat / --name-only
  'values', // generic fallback for paginated payloads
];

export class OutputService implements IOutputService {
  private readonly noColor: boolean;
  private readonly noUnicode: boolean;
  private jsonFormatOptions: JsonFormatOptions = {};

  constructor(options?: { noColor?: boolean; noUnicode?: boolean }) {
    this.noColor = options?.noColor ?? false;
    this.noUnicode = options?.noUnicode ?? false;
  }

  public setJsonFormatOptions(options: JsonFormatOptions): void {
    this.jsonFormatOptions = { ...options };
  }

  public async json(data: unknown): Promise<void> {
    const { fields, jq } = this.jsonFormatOptions;

    let result: unknown = data;
    if (fields && fields.length > 0) {
      result = projectByFieldsRespectingWrapper(result, fields);
    }

    if (jq) {
      const jqOutput = await runJq(result, jq);
      // jq terminates each value with a newline; strip the trailing one so
      // console.log doesn't double it. Preserve internal newlines between
      // emitted values.
      const trimmed = jqOutput.endsWith('\n')
        ? jqOutput.slice(0, -1)
        : jqOutput;
      if (trimmed.length > 0) {
        console.log(trimmed);
      }
      return;
    }

    console.log(JSON.stringify(result, null, 2));
  }

  public jsonError(data: unknown): void {
    console.error(JSON.stringify(data));
  }

  public table(headers: string[], rows: string[][]): void {
    if (rows.length === 0) {
      return;
    }

    const sanitizedHeaders = headers.map(stripControl);
    const sanitizedRows = rows.map((row) =>
      row.map((cell) => stripControl(cell || ''))
    );

    // Calculate column widths
    const widths = sanitizedHeaders.map((header, index) => {
      const maxRowWidth = Math.max(
        ...sanitizedRows.map((row) => (row[index] || '').length)
      );
      return Math.max(header.length, maxRowWidth);
    });

    // Print header
    const headerRow = sanitizedHeaders
      .map((header, index) => header.padEnd(widths[index]!))
      .join('  ');

    console.log(this.format(headerRow, chalk.bold));

    // Print separator
    console.log(widths.map((width) => '-'.repeat(width)).join('  '));

    // Print rows
    for (const row of sanitizedRows) {
      const formattedRow = row
        .map((cell, index) => cell.padEnd(widths[index]!))
        .join('  ');
      console.log(formattedRow);
    }
  }

  public success(message: string): void {
    const symbol = this.format(this.symbol('✓', 'OK'), chalk.green);
    console.log(`${symbol} ${stripControl(message)}`);
  }

  public error(message: string): void {
    const symbol = this.format(this.symbol('✗', 'ERR'), chalk.red);
    console.error(`${symbol} ${stripControl(message)}`);
  }

  public warning(message: string): void {
    const symbol = this.format(this.symbol('⚠', '!!'), chalk.yellow);
    console.warn(`${symbol} ${stripControl(message)}`);
  }

  public info(message: string): void {
    const symbol = this.format(this.symbol('ℹ', 'i'), chalk.blue);
    console.log(`${symbol} ${stripControl(message)}`);
  }

  public symbol(unicode: string, ascii: string): string {
    return this.noUnicode ? ascii : unicode;
  }

  public text(message: string): void {
    console.log(stripControl(message));
  }

  public truncate(text: string, maxLength: number, suffix = '...'): string {
    if (maxLength <= 0 || text.length <= maxLength) {
      return text;
    }
    if (suffix.length >= maxLength) {
      return text.slice(0, maxLength);
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  public formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format text with chalk, respecting noColor option
   */
  public format(text: string, formatter: (text: string) => string): string {
    if (this.noColor) {
      return text;
    }
    return formatter(text);
  }

  /**
   * Get a dimmed text formatter
   */
  public dim(text: string): string {
    return this.format(text, chalk.dim);
  }

  /**
   * Get a cyan text formatter (for highlighting)
   */
  public highlight(text: string): string {
    return this.format(text, chalk.cyan);
  }

  /**
   * Get a bold text formatter
   */
  public bold(text: string): string {
    return this.format(text, chalk.bold);
  }

  public red(text: string): string {
    return this.format(text, chalk.red);
  }

  public green(text: string): string {
    return this.format(text, chalk.green);
  }

  public yellow(text: string): string {
    return this.format(text, chalk.yellow);
  }

  public cyan(text: string): string {
    return this.format(text, chalk.cyan);
  }

  public magenta(text: string): string {
    return this.format(text, chalk.magenta);
  }

  public gray(text: string): string {
    return this.format(text, chalk.gray);
  }

  public blue(text: string): string {
    return this.format(text, chalk.blue);
  }

  public underline(text: string): string {
    return this.format(text, chalk.underline);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Apply field projection. If the input is an array, project per-item. If it
 * is a wrapper object whose first matching `WRAPPER_ARRAY_KEYS` entry holds
 * an array, project per-item on that array and return just the array (matches
 * `gh` semantics — drops the wrapper). Otherwise project on the object.
 */
function projectByFieldsRespectingWrapper(
  data: unknown,
  fields: string[]
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => projectFields(item, fields));
  }

  if (isPlainObject(data)) {
    for (const key of WRAPPER_ARRAY_KEYS) {
      const inner = data[key];
      if (Array.isArray(inner)) {
        return inner.map((item) => projectFields(item, fields));
      }
    }
    return projectFields(data, fields);
  }

  return projectFields(data, fields);
}

async function runJq(data: unknown, expression: string): Promise<string> {
  let jq: typeof import('jq-wasm');
  try {
    jq = await import('jq-wasm');
  } catch (error) {
    throw new BBError({
      code: ErrorCode.JQ_FAILED,
      message:
        'Failed to load the embedded jq runtime (jq-wasm). ' +
        'Reinstall the CLI or report this issue.',
      cause: error instanceof Error ? error : undefined,
      context: { expression },
    });
  }

  let result: { stdout: string; stderr: string; exitCode: number };
  try {
    result = await jq.raw(data as object, expression);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new BBError({
      code: ErrorCode.JQ_FAILED,
      message: `jq evaluation failed: ${message}`,
      context: { expression },
    });
  }

  if (result.exitCode !== 0) {
    throw new BBError({
      code: ErrorCode.JQ_FAILED,
      message: `jq evaluation failed: ${result.stderr.trim() || 'unknown error'}`,
      context: { expression, exitCode: result.exitCode },
    });
  }
  return result.stdout;
}
