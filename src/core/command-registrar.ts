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
import type { ServiceToken } from './container.js';
import type { HelpTextBuilder } from '../help-text.js';

export interface ContextOptions {
  /**
   * Let `--jq` apply without `--json`, for commands whose output is already
   * JSON (e.g. `bb api`).
   */
  allowJqWithoutJson?: boolean;
}

export interface CommandRegistrar {
  readonly buildHelpText: HelpTextBuilder;
  /** Run the command registered under `token` with `options` as given. */
  run(token: ServiceToken, options?: unknown): Promise<void>;
  /**
   * Run the command registered under `token` with the root's `--workspace` /
   * `--repo` merged into `options` (explicit per-command values win).
   */
  runWithGlobalOptions(
    token: ServiceToken,
    options: Record<string, unknown>,
    contextOptions?: ContextOptions
  ): Promise<void>;
}

export type RegisterCommands = (
  parent: Command,
  registrar: CommandRegistrar
) => void;
