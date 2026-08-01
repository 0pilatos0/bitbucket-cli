/**
 * What a bare-ish `bb` invocation actually meant.
 *
 * Commander hands the root action whatever it could not dispatch. Deciding what
 * that leftover means is pure logic over the command tree, so it lives here as a
 * function of its inputs rather than inside the root `.action()` closure: it
 * keeps the Commander wiring in `src/cli.ts` declarative, and it is unit
 * testable without driving `parseAsync` over the module-level `cli` singleton.
 */

import type { Command } from 'commander';
import {
  buildCommandPath,
  resolveCommandPath,
  visibleChildNames,
} from './core/command-tree.js';
import { didYouMeanSuffix } from './core/suggest.js';
import { BBError, ErrorCode } from './types/errors.js';

export type RootInvocation =
  /** Print this command's help and exit 0 (`bb`, `bb help`, `bb help pr`). */
  | { kind: 'help'; command: Command; welcome: boolean }
  /** Report this and exit 1. */
  | { kind: 'error'; error: BBError };

/**
 * Build the "unknown command" error for `token`, suggesting a close match from
 * `parent`'s visible subcommands — the same candidate set Commander's own
 * `unknownCommand()` uses — and otherwise pointing at the relevant `--help`.
 */
export function unknownCommandError(token: string, parent: Command): BBError {
  const suggestion = didYouMeanSuffix(token, visibleChildNames(parent));
  const parentPath = buildCommandPath(parent);
  const helpCommand = `bb ${parentPath ? `${parentPath} ` : ''}--help`;

  return new BBError({
    code: ErrorCode.VALIDATION_INVALID,
    message:
      `unknown command '${token}'` +
      (suggestion || `\nRun \`${helpCommand}\` to see available commands.`),
    context: { command: token },
  });
}

/** The `--json` swallowed a command name and every token names a real command. */
function jsonFlagPositionError(tokens: readonly string[]): BBError {
  const [swallowed, ...rest] = tokens;
  const command = tokens.join(' ');

  return new BBError({
    code: ErrorCode.VALIDATION_INVALID,
    message:
      `--json consumed '${swallowed}' as its field list` +
      (rest.length > 0
        ? `, so '${rest.join(' ')}' was parsed as a top-level command.`
        : '.') +
      `\nPut --json after the subcommand: bb ${command} --json`,
    context: { command: swallowed, args: rest },
  });
}

/**
 * The command name `--json` swallowed, or `undefined` if its value really is a
 * field list. Two independent tells, either sufficient:
 *
 * - **tokens remain.** The root declares no positional arguments, so a leftover
 *   token means something was mis-parsed, and the only thing that eats a token
 *   here is `--json [fields]`.
 * - **the value names a top-level command.** Catches `bb --json pr`, where
 *   nothing is left over to give the first tell away.
 *
 * Neither fires for `bb --json name,title` or `bb --json <typo>`, which stay
 * indistinguishable from a genuine field list and fall through to root help.
 */
function swallowedCommandToken(
  root: Command,
  input: { args: readonly string[]; jsonOption: unknown }
): string | undefined {
  if (typeof input.jsonOption !== 'string') return undefined;
  if (input.args.length > 0) return input.jsonOption;
  return visibleChildNames(root).includes(input.jsonOption)
    ? input.jsonOption
    : undefined;
}

/**
 * Interpret a root invocation.
 *
 * `args` is Commander's leftover positional list and `jsonOption` the raw
 * `--json` value. Any token `--json` swallowed is prepended (see
 * {@link swallowedCommandToken}) so the whole invocation resolves in ONE walk
 * down the tree — that is what lets a misplaced `--json` and an unknown command
 * share a single code path instead of being special-cased separately.
 */
export function resolveRootInvocation(
  root: Command,
  input: { args: readonly string[]; jsonOption: unknown }
): RootInvocation {
  const swallowed = swallowedCommandToken(root, input);
  const tokens =
    swallowed === undefined ? [...input.args] : [swallowed, ...input.args];

  if (tokens.length === 0) {
    return { kind: 'help', command: root, welcome: true };
  }

  // `bb help <command>`. Commander omits its own help command whenever the root
  // has an action handler, so `bb pr help` works while `bb help pr` would not.
  if (tokens[0] === 'help') {
    const { command, unresolved } = resolveCommandPath(root, tokens.slice(1));
    return unresolved === undefined
      ? { kind: 'help', command, welcome: false }
      : { kind: 'error', error: unknownCommandError(unresolved, command) };
  }

  const { command, unresolved } = resolveCommandPath(root, tokens);

  // Every token named a real command, so the only mistake was flag position.
  if (unresolved === undefined && swallowed !== undefined) {
    return { kind: 'error', error: jsonFlagPositionError(tokens) };
  }

  // Report the token that is actually wrong, against the candidates valid at
  // its own depth. Blaming `tokens[0]` here would misreport `--json prr list`
  // as "unknown command 'list'" — the one token the user got right.
  return {
    kind: 'error',
    error: unknownCommandError(unresolved ?? tokens[0]!, command),
  };
}
