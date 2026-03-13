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
    try {
      return await this.execute(options, context);
    } catch (error) {
      this.handleError(error, context);
      throw error;
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
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: message || `Option --${name} is required`,
      });
    }
    return value;
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
