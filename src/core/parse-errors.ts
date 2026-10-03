/**
 * Commander's own parse failures (unknown option, missing argument, unknown
 * subcommand, ...) happen before any action runs, so they never reach
 * `BaseCommand.handleError()`. This routes them through the same contract:
 * a `BBError`-shaped JSON envelope on stderr when `--json` or `--jq` is in
 * argv, and an exit status from `exitCodeFor()`.
 */

import type { Command, CommanderError } from 'commander';
import { BBError, ErrorCode } from '../types/errors.js';
import { buildCommandPath } from './command-tree.js';
import { exitCodeFor } from './exit-codes.js';

const MISSING_VALUE_CODES = new Set([
  'commander.missingArgument',
  'commander.optionMissingArgument',
  'commander.missingMandatoryOptionValue',
]);

/**
 * True when `--json` or `--jq` (with or without a value) appears before any
 * `--`: either one asks for machine-readable output.
 */
export function argvRequestsJson(argv: readonly string[]): boolean {
  for (const arg of argv) {
    if (arg === '--') return false;
    if (/^--(json|jq)(=|$)/.test(arg)) return true;
  }
  return false;
}

/**
 * The `--json` error envelope for a Commander parse failure. `commander.help`
 * here is a group run without a subcommand (an explicit `--help` exits 0 and
 * never gets this far).
 */
export function parseErrorEnvelope(
  error: CommanderError,
  command: Command
): { error: BBError; hint: string } {
  const path = buildCommandPath(command);
  const missingSubcommand = error.code === 'commander.help';
  return {
    error: new BBError({
      code:
        missingSubcommand || MISSING_VALUE_CODES.has(error.code)
          ? ErrorCode.VALIDATION_REQUIRED
          : ErrorCode.VALIDATION_INVALID,
      message: missingSubcommand
        ? `missing subcommand for '${path}'`
        : error.message.replace(/^error: /, ''),
      context: {
        parseError: missingSubcommand
          ? 'missingSubcommand'
          : error.code.replace(/^commander\./, ''),
        ...(path ? { commandPath: path } : {}),
      },
    }),
    hint: `Run \`${path ? `bb ${path}` : 'bb'} --help\` for usage.`,
  };
}

export interface ParseErrorHandlingOptions {
  /** The user's arguments, read when an error occurs. */
  argv: () => readonly string[];
  writeJsonError: (payload: Record<string, unknown>) => void;
  exit: (code: number) => never;
}

/**
 * Install on every command in the tree. Commander only copies these settings
 * to children made with `.command()`, not to groups attached with
 * `addCommand()`, so they are set per command here.
 */
export function installParseErrorHandling(
  root: Command,
  options: ParseErrorHandlingOptions
): void {
  const jsonRequested = (): boolean => argvRequestsJson(options.argv());

  const install = (command: Command): void => {
    // Commander writes parse errors, and the help it prints for a group run
    // without a subcommand, to stderr; the envelope replaces both.
    const writeErr = command.configureOutput().writeErr;
    command.configureOutput({
      writeErr: (str) => {
        if (!jsonRequested()) writeErr?.(str);
      },
    });
    command.exitOverride((error) => {
      if (error.exitCode === 0) options.exit(0);
      const { error: bbError, hint } = parseErrorEnvelope(error, command);
      if (jsonRequested()) {
        options.writeJsonError({ ...bbError.toJSON(), hint });
      }
      options.exit(exitCodeFor(bbError.code));
    });
    for (const child of command.commands) install(child);
  };

  install(root);
}
