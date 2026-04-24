/**
 * Command interfaces for the command pattern
 */

import type { GlobalOptions } from '../../types/config.js';
import type { BBError } from '../../types/errors.js';

/**
 * Base command context passed to all commands
 */
export interface CommandContext {
  globalOptions: GlobalOptions;
  /**
   * Validation error captured during context construction (e.g. invalid
   * combinations of `--json` / `--jq`). Deferred so it can be surfaced
   * through BaseCommand's normal error handling rather than escaping the
   * Commander action handler as an unhandled rejection.
   */
  validationError?: BBError;
}

/**
 * Base interface for all commands
 */
export interface ICommand<TOptions = unknown, TResult = void> {
  readonly name: string;
  readonly description: string;

  execute(options: TOptions, context: CommandContext): Promise<TResult>;
  run(options: TOptions, context: CommandContext): Promise<TResult>;
}

/**
 * Command metadata for registration
 */
export interface CommandMetadata {
  name: string;
  description: string;
  arguments?: ArgumentDefinition[];
  options?: OptionDefinition[];
}

export interface ArgumentDefinition {
  name: string;
  description: string;
  required?: boolean;
}

export interface OptionDefinition {
  flags: string;
  description: string;
  defaultValue?: unknown;
}
