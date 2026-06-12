/**
 * Base command class with common functionality
 */

import type { ICommand, CommandContext } from './interfaces/commands.js';
import type { IOutputService } from './interfaces/services.js';
import { WRAPPER_ARRAY_KEYS } from '../services/output.service.js';
import {
  collectPagesWithMeta,
  resolveLimit,
  type PaginatedCollection,
} from '../services/pagination.js';
import { BBError, ErrorCode } from '../types/errors.js';

/**
 * Declarative spec for {@link BaseCommand.runList}. Captures everything that
 * varies between paginated list commands once context resolution and filter
 * construction (which stay in each command) are done.
 */
export interface RunListSpec<TItem> {
  /**
   * The command options carrying `--limit` / `--all`; resolved via
   * `resolveLimit()` (defaulting to 25, `Infinity` for `--all`).
   */
  options: { limit?: string; all?: boolean };
  /** Fetch one page from the API (1-based page number). */
  fetchPage: (
    page: number,
    pagelen: number
  ) => Promise<PaginatedCollection<TItem>>;
  /** Optional client-side filter applied to each fetched item. */
  shouldInclude?: (item: TItem) => boolean;
  /**
   * Key under which the collected items array is emitted in the JSON
   * envelope (e.g. `pullRequests`, `comments`). MUST be registered in
   * `WRAPPER_ARRAY_KEYS` (src/services/output.service.ts) so `--json
   * fields` / `--jq` projection unwraps the array; `runList()` throws if it
   * is not, so drift is caught by any test exercising the command.
   */
  wrapperKey: string;
  /**
   * Extra envelope keys (workspace, repoSlug, filters, ...) spread BEFORE
   * `count` so the serialized JSON keeps the metadata-first key order that
   * tests and docs rely on.
   */
  jsonMetadata?: Record<string, unknown>;
  /**
   * Empty-state message for table mode (JSON mode still emits the full
   * envelope with `count: 0`). Pass a function when the message depends on
   * runtime state such as active filters.
   */
  emptyMessage: string | (() => string);
  /** Table column headers. */
  tableHeaders: string[];
  /** Maps one item to its table row. */
  mapRow: (item: TItem) => string[];
  /** Noun for the "Showing N <noun>..." more-results footer. */
  noun: string;
}

export abstract class BaseCommand<
  TOptions = unknown,
  TResult = void,
> implements ICommand<TOptions, TResult> {
  public abstract readonly name: string;
  public abstract readonly description: string;

  /**
   * Exact command path (e.g. `pr comments add`) captured from the context in
   * `run()` and used by `appendHelpHint()`. Safe as instance state because the
   * CLI resolves and runs exactly one command per process invocation.
   */
  private commandPath?: string;

  constructor(protected readonly output: IOutputService) {}

  public abstract execute(
    options: TOptions,
    context: CommandContext
  ): Promise<TResult>;

  /**
   * Execute the command with error handling
   */
  public async run(
    options: TOptions,
    context: CommandContext
  ): Promise<TResult> {
    this.commandPath = context.commandPath;
    this.output.setJsonFormatOptions({
      json: !!context.globalOptions.json,
      fields: context.globalOptions.jsonFields,
      jq: context.globalOptions.jq,
    });

    try {
      if (context.validationError) {
        throw context.validationError;
      }
      return await this.execute(options, context);
    } catch (error) {
      this.handleError(error, context);
      throw error;
    } finally {
      this.output.setJsonFormatOptions({});
    }
  }

  /**
   * Handle command error - output error and set exit code
   */
  protected handleError(error: unknown, context: CommandContext): void {
    if (context.globalOptions.json) {
      this.output.jsonError(this.normalizeErrorForJson(error));
    } else if (error instanceof Error) {
      this.output.error(error.message);
    } else {
      this.output.error(String(error));
    }

    // Only set exit code in production - during tests this causes false failures
    // because the exit code persists across test files
    if (process.env.NODE_ENV !== 'test') {
      process.exitCode = 1;
    }
  }

  private normalizeErrorForJson(error: unknown): Record<string, unknown> {
    if (error instanceof BBError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        code: ErrorCode.UNKNOWN,
        message: error.message,
      };
    }

    return {
      name: 'Error',
      code: ErrorCode.UNKNOWN,
      message: String(error),
    };
  }

  /**
   * Validate required option
   */
  protected requireOption<T>(
    value: T | undefined,
    name: string,
    message?: string
  ): T {
    if (value === undefined || value === null || value === '') {
      const baseMessage = message || `Option --${name} is required`;
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(baseMessage),
      });
    }
    return value;
  }

  /**
   * Append a `--help` footer pointing back at the active command path so
   * users can discover the full option list when validation fails.
   */
  protected appendHelpHint(message: string): string {
    const commandPath = this.getCommandPath();
    const target = commandPath ? `bb ${commandPath} --help` : 'bb --help';
    return `${message} Run \`${target}\` for usage.`;
  }

  private getCommandPath(): string {
    return this.commandPath ?? '';
  }

  /**
   * Parse a string option as an integer, throwing on invalid input
   */
  protected parseIntOption(value: string, name: string): number {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `--${name} must be a valid integer`,
        context: { [name]: value },
      });
    }
    return parsed;
  }

  /**
   * Parse a string option as a positive integer (>= 1), throwing on invalid
   * input. Use for IDs, limits, line numbers, and any other count-like option
   * where zero or negative values would be meaningless. Strict: rejects
   * trailing/leading non-digit characters (e.g. "1abc", "1.5") so user typos
   * surface immediately rather than silently truncating.
   */
  protected parsePositiveInt(value: string, name: string): number {
    const trimmed = value.trim();
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || String(parsed) !== trimmed) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(`--${name} must be a positive integer.`),
        context: { [name]: value },
      });
    }
    return parsed;
  }

  /**
   * Truncate `text` for table/list rendering, honoring the global
   * `--no-truncate` flag carried on `context.globalOptions`. Pass the
   * `globalOptions` (or any object with `noTruncate`) so commands don't
   * each have to thread the flag through their own helpers.
   */
  protected truncateText(
    text: string,
    maxLength: number,
    opts: { noTruncate?: boolean } = {}
  ): string {
    if (opts.noTruncate) {
      return text;
    }
    return this.output.truncate(text, maxLength);
  }

  /**
   * Print a dimmed footer after a list table when the output was capped by
   * `--limit` and more results exist on the server. No-op when nothing was
   * truncated. Callers omit this in JSON mode by returning before rendering
   * the table (JSON payloads carry their own `count`).
   */
  protected printMoreHint(
    shown: number,
    hasMore: boolean,
    noun = 'results'
  ): void {
    if (!hasMore) return;
    this.output.text(
      this.output.dim(
        `Showing ${shown} ${noun}. Use --limit <n> or --all to see more.`
      )
    );
  }

  /**
   * Gate a destructive action on an explicit confirmation flag (typically
   * `--yes`). Throws a standard `BBError` so the warning and the
   * "Use --yes to confirm." instruction stay consistent across commands.
   */
  protected requireConfirmation(
    confirmed: boolean | undefined,
    warning: string
  ): void {
    if (confirmed) return;
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message: `${warning}\nUse --yes to confirm.`,
    });
  }

  /**
   * Shared driver for paginated list commands. Runs the common tail of every
   * `bb ... list`-style command: resolve `--limit`/`--all`, collect pages via
   * `collectPagesWithMeta`, then either emit the JSON envelope
   * (`{ ...jsonMetadata, count, [wrapperKey]: items }`), print the
   * empty-state message, or render the table followed by the more-results
   * hint. Context resolution and filter construction remain the caller's
   * responsibility — build those first, then delegate here.
   */
  protected async runList<TItem>(
    spec: RunListSpec<TItem>,
    context: CommandContext
  ): Promise<void> {
    if (!WRAPPER_ARRAY_KEYS.includes(spec.wrapperKey)) {
      throw new Error(
        `runList wrapperKey "${spec.wrapperKey}" is not registered in ` +
          'WRAPPER_ARRAY_KEYS (src/services/output.service.ts). Register it ' +
          'there so --json fields/--jq projection unwraps the items array.'
      );
    }

    const limit = resolveLimit(spec.options);
    const { items, hasMore } = await collectPagesWithMeta<TItem>({
      limit,
      fetchPage: spec.fetchPage,
      shouldInclude: spec.shouldInclude,
    });

    if (context.globalOptions.json) {
      await this.output.json({
        ...(spec.jsonMetadata ?? {}),
        count: items.length,
        [spec.wrapperKey]: items,
      });
      return;
    }

    if (items.length === 0) {
      this.output.info(
        typeof spec.emptyMessage === 'function'
          ? spec.emptyMessage()
          : spec.emptyMessage
      );
      return;
    }

    this.output.table(
      spec.tableHeaders,
      items.map((item) => spec.mapRow(item))
    );
    this.printMoreHint(items.length, hasMore, spec.noun);
  }

  /**
   * Validate a string option against a set of allowed values
   */
  protected parseEnumOption<T extends string>(
    value: string,
    name: string,
    allowed: readonly T[]
  ): T {
    if (!allowed.includes(value as T)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `--${name} must be one of: ${allowed.join(', ')}`,
        context: { [name]: value },
      });
    }
    return value as T;
  }
}
