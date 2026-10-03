/**
 * Output service for formatted console output
 */

import chalk from 'chalk';
import type {
  IOutputService,
  ISpinner,
  JsonFormatOptions,
  TableOptions,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';
import { DEFAULT_LOCALE } from './locale.js';
import { projectFields } from './output.project.js';
import { resolvePagerCommand, runPager } from './pager.js';
import { Spinner, createNoopSpinner } from './spinner.js';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

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

// eslint-disable-next-line no-control-regex
const SGR = /\x1b\[[0-9;?]*m/g;

const COLUMN_GAP = '  ';
const ELLIPSIS = '...';
// Shrinking a column narrower than this leaves too little to recognize; past
// that point the row is allowed to overflow and wrap instead.
const MIN_FLEX_WIDTH = 10;

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', (365 / 12) * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

type TerminalState = Pick<NodeJS.WriteStream, 'isTTY' | 'columns'>;

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
export const WRAPPER_ARRAY_KEYS: readonly string[] = [
  'pullRequests', // pr list
  'repositories', // repo list
  'snippets', // snippet list
  'comments', // pr comments list, snippet comments list
  'reviewers', // pr reviewers list, repo default-reviewers list
  'activities', // pr activity
  'statuses', // pr checks
  'files', // pr diff --stat / --name-only
  'pipelines', // pipeline list
  'commits', // commit list
  'workspaces', // workspace list
  'projects', // project list
  'entries', // repo ls
  'downloads', // repo downloads list
  'results', // search code
  'webhooks', // webhook list
  'branchRestrictions', // branch-restriction list
  'sshKeys', // ssh-key list
  'gpgKeys', // gpg-key list
  'deployments', // deployment list
  'environments', // deployment environments
  'checks', // doctor
  'values', // generic fallback for paginated payloads
];

let closedPipeGuardInstalled = false;

// A reader that exits early (`bb repo cat big.bin | head`) closes the pipe
// mid-write. That is a normal end of output, like `cat` under SIGPIPE, not
// an error worth a Bun crash report. macOS reports ENOTCONN instead of EPIPE
// when stdout is a socketpair, which is what Node/Bun spawn hands a child.
const CLOSED_READER_CODES = new Set(['EPIPE', 'ENOTCONN']);

function ignoreClosedStdoutPipe(): void {
  if (closedPipeGuardInstalled) {
    return;
  }
  closedPipeGuardInstalled = true;
  process.stdout.on('error', (error: NodeJS.ErrnoException) => {
    if (!CLOSED_READER_CODES.has(error.code ?? '')) {
      throw error;
    }
  });
}

export class OutputService implements IOutputService {
  private readonly noColor: boolean;
  private readonly noUnicode: boolean;
  private readonly noTruncate: boolean;
  private readonly locale: string;
  private readonly terminal: TerminalState;
  private jsonFormatOptions: JsonFormatOptions = {};
  private activeSpinner: ISpinner | null = null;
  // Collects stdout while a `withPager()` run is active, so the whole page
  // can be handed to the pager in one go.
  private pageBuffer: string[] | null = null;

  constructor(options?: {
    noColor?: boolean;
    noUnicode?: boolean;
    noTruncate?: boolean;
    locale?: string;
    /** Where stdout goes; defaults to the live `process.stdout`. */
    terminal?: TerminalState;
  }) {
    this.noColor = options?.noColor ?? false;
    this.noUnicode = options?.noUnicode ?? false;
    this.noTruncate = options?.noTruncate ?? false;
    this.locale = options?.locale ?? DEFAULT_LOCALE;
    this.terminal = options?.terminal ?? process.stdout;
  }

  public setJsonFormatOptions(options: JsonFormatOptions): void {
    this.jsonFormatOptions = { ...options };
  }

  public isJsonMode(): boolean {
    return this.jsonFormatOptions.json === true;
  }

  public spinner(text: string): ISpinner {
    // Disabled in JSON mode (would corrupt stdout), non-TTY streams (no point
    // animating into a pipe), and tests (deterministic output, no escape
    // sequences leaking into snapshots). The disabled path returns a no-op
    // spinner so callers see a uniform handle.
    const enabled =
      !this.isJsonMode() &&
      !!this.terminal.isTTY &&
      process.env.NODE_ENV !== 'test';

    if (!enabled) {
      return createNoopSpinner();
    }

    // Stop any prior spinner so two concurrent animations don't fight over
    // the same line. Commands that nest spinners are responsible for ordering;
    // this guard simply prevents corruption.
    this.activeSpinner?.stop();

    const spinner: ISpinner = new Spinner(text, {
      enabled: true,
      noColor: this.noColor,
      stream: process.stdout,
      onStop: () => {
        if (this.activeSpinner === spinner) {
          this.activeSpinner = null;
        }
      },
    });
    this.activeSpinner = spinner;
    return spinner;
  }

  public async json(data: unknown): Promise<void> {
    this.stopActiveSpinner();
    const { fields, jq, rawOutput, lean } = this.jsonFormatOptions;
    // Pretty for people reading a terminal, compact for pipes, files, and
    // agents, where indentation is only extra bytes to parse.
    const pretty = !!this.terminal.isTTY;

    let result: unknown = data;
    if (fields && fields.length > 0) {
      result = projectByFieldsRespectingWrapper(result, fields);
    }
    if (lean) {
      result = pruneLinks(result);
    }

    if (jq) {
      const flags = [
        ...(pretty ? [] : ['--compact-output']),
        ...(rawOutput ? ['--raw-output'] : []),
      ];
      const jqOutput = await runJq(result, jq, flags);
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

    console.log(JSON.stringify(result, null, pretty ? 2 : undefined));
  }

  public jsonError(data: unknown): void {
    this.stopActiveSpinner();
    console.error(JSON.stringify(data));
  }

  public table(
    headers: string[],
    rows: string[][],
    options: TableOptions = {}
  ): void {
    this.stopActiveSpinner();
    if (rows.length === 0) {
      return;
    }

    // stripControl intentionally preserves \n/\r/\t (text() relies on them for
    // multi-line output), but inside a table cell those characters break the
    // single-line-per-row layout and corrupt column-width math. Collapse any
    // run of them to a single space so each row stays on one line.
    const sanitizeCell = (cell: string): string =>
      stripControl(cell).replace(/[\t\n\r]+/g, ' ');

    const sanitizedHeaders = headers.map(sanitizeCell);
    const sanitizedRows = rows.map((row) =>
      sanitizedHeaders.map((_, index) => sanitizeCell(row[index] || ''))
    );

    // Piped output is tab-separated with no header, like `gh`, so `cut -f`
    // and friends see whole values instead of padded, truncated columns.
    if (!this.terminal.isTTY) {
      for (const row of sanitizedRows) {
        this.writeLine(row.map((cell) => cell.replace(SGR, '')).join('\t'));
      }
      return;
    }

    const naturalWidths = sanitizedHeaders.map((header, index) =>
      Math.max(
        Bun.stringWidth(header),
        ...sanitizedRows.map((row) => Bun.stringWidth(row[index]!))
      )
    );
    const widths = this.noTruncate
      ? naturalWidths
      : fitColumnWidths(
          naturalWidths,
          options.flexColumns ?? [],
          this.terminal.columns
        );

    const lastIndex = widths.length - 1;
    const renderRow = (cells: string[]): string =>
      cells
        .map((cell, index) => {
          const fitted = truncateToWidth(cell, widths[index]!);
          return index === lastIndex
            ? fitted
            : fitted + ' '.repeat(widths[index]! - Bun.stringWidth(fitted));
        })
        .join(COLUMN_GAP);

    this.writeLine(this.format(renderRow(sanitizedHeaders), chalk.bold));
    this.writeLine(widths.map((width) => '-'.repeat(width)).join(COLUMN_GAP));
    for (const row of sanitizedRows) {
      this.writeLine(renderRow(row));
    }
  }

  public success(message: string): void {
    this.stopActiveSpinner();
    const symbol = this.format(this.symbol('✓', 'OK'), chalk.green);
    this.writeLine(`${symbol} ${stripControl(message)}`);
  }

  public error(message: string): void {
    this.stopActiveSpinner();
    const symbol = this.format(this.symbol('✗', 'ERR'), chalk.red);
    console.error(`${symbol} ${stripControl(message)}`);
  }

  public warning(message: string): void {
    this.stopActiveSpinner();
    const symbol = this.format(this.symbol('⚠', '!!'), chalk.yellow);
    console.warn(`${symbol} ${stripControl(message)}`);
  }

  public info(message: string): void {
    this.stopActiveSpinner();
    const symbol = this.format(this.symbol('ℹ', 'i'), chalk.blue);
    this.writeLine(`${symbol} ${stripControl(message)}`);
  }

  public symbol(unicode: string, ascii: string): string {
    return this.noUnicode ? ascii : unicode;
  }

  public text(message: string): void {
    this.stopActiveSpinner();
    this.writeLine(stripControl(message));
  }

  public stderr(message: string): void {
    this.stopActiveSpinner();
    console.error(stripControl(message));
  }

  public raw(data: Uint8Array): void {
    this.stopActiveSpinner();
    ignoreClosedStdoutPipe();
    if (this.terminal.isTTY) {
      const text = stripControl(new TextDecoder().decode(data));
      if (this.pageBuffer) {
        this.pageBuffer.push(text);
        return;
      }
      process.stdout.write(text);
      return;
    }
    process.stdout.write(data);
  }

  public separator(width = 60): void {
    this.stopActiveSpinner();
    if (width <= 0) {
      this.writeLine('');
      return;
    }
    this.writeLine(
      this.format(this.symbol('─', '-').repeat(width), chalk.gray)
    );
  }

  public async withPager<T>(run: () => Promise<T>): Promise<T> {
    const pager =
      this.isJsonMode() || !this.terminal.isTTY || this.pageBuffer
        ? undefined
        : resolvePagerCommand(process.env.BB_PAGER ?? process.env.PAGER);
    if (!pager) {
      return run();
    }

    const buffer: string[] = [];
    this.pageBuffer = buffer;
    let result: T;
    try {
      result = await run();
    } catch (error) {
      // Show partial output right away so the error printed next isn't
      // hidden behind a pager waiting for input.
      this.pageBuffer = null;
      process.stdout.write(buffer.join(''));
      throw error;
    }
    this.pageBuffer = null;
    const text = buffer.join('');
    if (text.length > 0 && !(await runPager(pager, text))) {
      process.stdout.write(text);
    }
    return result;
  }

  private writeLine(line: string): void {
    if (this.pageBuffer) {
      this.pageBuffer.push(`${line}\n`);
      return;
    }
    console.log(line);
  }

  /**
   * Stop and forget the currently active spinner, if any. Called by every
   * write-emitting method so a forgotten spinner can never interleave with
   * regular output. Safe to call when no spinner is active.
   */
  private stopActiveSpinner(): void {
    if (this.activeSpinner) {
      const spinner = this.activeSpinner;
      this.activeSpinner = null;
      spinner.stop();
    }
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
    try {
      return d.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS);
    } catch {
      // Invalid BCP-47 tag: fall back to the historical default so a typo
      // in --locale or LANG doesn't crash a date-rendering command.
      return d.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMAT_OPTIONS);
    }
  }

  public formatRelativeDate(date: string | Date, now = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return '-';
    }
    // Piped output feeds other tools, which want a sortable, locale-free date.
    if (!this.terminal.isTTY) {
      return d.toISOString();
    }

    const seconds = (d.getTime() - now.getTime()) / 1000;
    const [unit, size] = RELATIVE_UNITS.find(
      ([, unitSeconds]) => Math.abs(seconds) >= unitSeconds
    ) ?? ['second', 1];
    const value = Math.trunc(seconds / size);
    try {
      return new Intl.RelativeTimeFormat(this.locale, {
        numeric: 'auto',
      }).format(value, unit);
    } catch {
      return new Intl.RelativeTimeFormat(DEFAULT_LOCALE, {
        numeric: 'auto',
      }).format(value, unit);
    }
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

/**
 * Narrow the flexible columns just enough for the row to fit `maxWidth`. The
 * widest flexible columns give up space first (a shared cap), so a long title
 * shrinks before a short branch name does. Without a known terminal width, or
 * when the row already fits, the natural widths are kept.
 */
export function fitColumnWidths(
  widths: number[],
  flexColumns: number[],
  maxWidth: number | undefined
): number[] {
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    COLUMN_GAP.length * (widths.length - 1);
  if (!maxWidth || total <= maxWidth) {
    return widths;
  }

  const flex = new Set(flexColumns.filter((index) => index < widths.length));
  const fixedTotal = total - [...flex].reduce((sum, i) => sum + widths[i]!, 0);
  let budget = maxWidth - fixedTotal;
  const flexWidths = [...flex]
    .map((index) => widths[index]!)
    .sort((a, b) => a - b);
  let cap = flexWidths.at(-1) ?? 0;
  for (const [position, width] of flexWidths.entries()) {
    const remaining = flexWidths.length - position;
    if (width * remaining > budget) {
      cap = Math.floor(budget / remaining);
      break;
    }
    budget -= width;
  }
  const limit = Math.max(cap, MIN_FLEX_WIDTH);

  return widths.map((width, index) =>
    flex.has(index) ? Math.min(width, limit) : width
  );
}

/**
 * Cut `text` to at most `width` terminal columns, ending in `...`. Width is
 * measured on screen, so ANSI color codes count as zero and wide (e.g. CJK)
 * characters as two. A cut cell loses its color: re-closing SGR spans
 * mid-string is not worth the complexity for a truncated value.
 */
export function truncateToWidth(text: string, width: number): string {
  if (Bun.stringWidth(text) <= width) {
    return text;
  }

  const budget = width > ELLIPSIS.length ? width - ELLIPSIS.length : width;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  let result = '';
  let used = 0;
  for (const { segment } of segmenter.segment(text.replace(SGR, ''))) {
    const segmentWidth = Bun.stringWidth(segment);
    if (used + segmentWidth > budget) {
      break;
    }
    result += segment;
    used += segmentWidth;
  }
  return width > ELLIPSIS.length ? result + ELLIPSIS : result;
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

/**
 * `--lean`: Bitbucket nests a `links` map of API and avatar URLs in nearly
 * every object, which dominates list payloads. Keep only `links.html` (the
 * web URL people and agents actually open) so `.links.html.href` still works.
 */
function pruneLinks(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(pruneLinks);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key !== 'links' || !isPlainObject(inner)) {
      result[key] = pruneLinks(inner);
    } else if (inner.html !== undefined) {
      result[key] = { html: inner.html };
    }
  }
  return result;
}

async function runJq(
  data: unknown,
  expression: string,
  flags: string[]
): Promise<string> {
  if (needsWindowsJqBunUpgrade(process.platform, Bun.version)) {
    throw new BBError({
      code: ErrorCode.JQ_FAILED,
      message:
        `Bun ${Bun.version} can leave --jq commands running indefinitely on Windows. ` +
        'Upgrade Bun to 1.4.2 or newer.',
      context: { expression, bunVersion: Bun.version },
    });
  }

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
    result = await jq.raw(data as object, expression, flags);
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

export function needsWindowsJqBunUpgrade(
  platform: NodeJS.Platform,
  version: string
): boolean {
  if (platform !== 'win32') return false;

  const match = /^(\d+)\.(\d+)\.(\d+)(?:$|[-+])/.exec(version);
  if (!match) return false;

  const major = Number.parseInt(match[1]!, 10);
  const minor = Number.parseInt(match[2]!, 10);
  const patch = Number.parseInt(match[3]!, 10);
  return (
    major < 1 || (major === 1 && (minor < 4 || (minor === 4 && patch < 2)))
  );
}
