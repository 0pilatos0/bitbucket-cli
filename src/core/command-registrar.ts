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

import type { Command, Option } from 'commander';
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

/**
 * Advertise an option's allowed values for shell completion (and `--help`)
 * WITHOUT Commander's parse-time enforcement. `generateCompletions` reads
 * `option.argChoices` to suggest enum values, but validation stays in the
 * command handlers (`parseEnumOption`), which raise `BBError` — so `--json`
 * error envelopes, the app's message style, and case-insensitive normalization
 * (e.g. `bb api -X get`) all keep working. Commander only enforces `argChoices`
 * via the `parseArg` that `.choices()` installs, so assigning it directly is
 * completion-only.
 */
export function withCompletionChoices(
  option: Option,
  values: readonly string[]
): Option {
  option.argChoices = [...values];
  return option;
}
