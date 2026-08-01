/**
 * Pure helpers for walking Commander's command tree.
 *
 * Kept free of any dependency on `src/cli.ts` so modules that need to inspect
 * the tree (command-path stamping, root dispatch) can import these without a
 * cycle back through the CLI wiring.
 */

import type { Command } from 'commander';

/**
 * The subcommands Commander itself would list under `Commands:` — the same set
 * its internal `unknownCommand()` builds its suggestions from, so ours match.
 */
export function visibleChildren(command: Command): Command[] {
  return command.createHelp().visibleCommands(command);
}

/** Names of {@link visibleChildren}, for suggestion candidate lists. */
export function visibleChildNames(command: Command): string[] {
  return visibleChildren(command).map((child) => child.name());
}

/**
 * Walk up the tree to build the space-joined path, excluding the root program
 * (`bb`, whose `.parent` is null). Yields `browse` for a top-level command and
 * `pr comments add` for a nested one.
 */
export function buildCommandPath(command: Command): string {
  const parts: string[] = [];
  let current: Command | null = command;
  while (current && current.parent) {
    parts.unshift(current.name());
    current = current.parent;
  }
  return parts.join(' ');
}

/**
 * Walk `path` down from `root`, returning the deepest command that resolved
 * plus the first token that didn't. `unresolved === undefined` means the whole
 * path named real commands.
 */
export function resolveCommandPath(
  root: Command,
  path: readonly string[]
): { command: Command; unresolved?: string } {
  let current = root;
  for (const token of path) {
    const next = visibleChildren(current).find(
      (candidate) => candidate.name() === token
    );
    if (!next) {
      return { command: current, unresolved: token };
    }
    current = next;
  }
  return { command: current };
}
