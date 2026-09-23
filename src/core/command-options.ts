/**
 * Commander option helpers shared by the command register modules.
 */

import type { Option } from 'commander';

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

/** Argument parser for a repeatable option; pair it with a `[]` default. */
export function collectRepeated(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
