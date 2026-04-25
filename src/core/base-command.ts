/**
 * Base command class with common functionality
 */

import type { ICommand, CommandContext } from './interfaces/commands.js';
import type { IOutputService } from './interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

export abstract class BaseCommand<
  TOptions = unknown,
  TResult = void,
> implements ICommand<TOptions, TResult> {
  public abstract readonly name: string;
  public abstract readonly description: string;

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
    const argv = process.argv.slice(2);
    const tokens: string[] = [];
    for (const arg of argv) {
      if (arg.startsWith('-')) break;
      tokens.push(arg);
    }
    // The trailing token is typically a positional argument value (e.g. PR id);
    // include only the leading subcommands. The simplest reliable signal is to
    // stop once we have the first two tokens, matching the `bb <group> <cmd>`
    // shape used throughout the CLI. Fall back to whatever we have.
    if (tokens.length >= 2) {
      return `${tokens[0]} ${tokens[1]}`;
    }
    return tokens.join(' ');
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
