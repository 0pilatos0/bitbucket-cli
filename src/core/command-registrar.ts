/**
 * The contract between the CLI composition root (`src/cli.ts`) and the
 * per-group command modules (`src/commands/<group>/register.ts`).
 *
 * A group module only declares its Commander subtree (names, arguments,
 * options, help text) and maps parsed arguments to the options object its DI
 * command expects. How that command is resolved and run, and how the root's
 * global flags become a `CommandContext`, stays with the composition root,
 * which hands each module a `CommandRegistrar`.
 */

import type { Command } from 'commander';
import type { CommandOptions, CommandToken } from './container.js';
import type { HelpTextBuilder } from '../help-text.js';
import type { GlobalOptions } from '../types/config.js';

/** The per-command `--workspace` / `--repo` the root's globals fill in. */
export type RepoOptions = Pick<GlobalOptions, 'workspace' | 'repo'>;

export interface ContextOptions {
  /**
   * Let `--jq` apply without `--json`, for commands whose output is already
   * JSON (e.g. `bb api`).
   */
  allowJqWithoutJson?: boolean;
}

/** Commands whose options type is `void` are run without an options object. */
type RunOptions<K extends CommandToken> =
  CommandOptions<K> extends void ? [] : [options: CommandOptions<K>];

export interface CommandRegistrar {
  readonly buildHelpText: HelpTextBuilder;
  /** Run the command registered under `token` with `options` as given. */
  run<K extends CommandToken>(
    token: K,
    ...options: RunOptions<K>
  ): Promise<void>;
  /**
   * Run the command registered under `token` with the root's `--workspace` /
   * `--repo` merged into `options` (explicit per-command values win).
   */
  runWithGlobalOptions<K extends CommandToken>(
    token: K,
    options: CommandOptions<K> & RepoOptions,
    contextOptions?: ContextOptions
  ): Promise<void>;
}

export type RegisterCommands = (
  parent: Command,
  registrar: CommandRegistrar
) => void;
