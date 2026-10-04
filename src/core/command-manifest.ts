/**
 * Machine-readable description of the Commander command tree, shared by
 * `bb help --json` and the docs drift check (scripts/check-command-docs.ts).
 */

import type { EventEmitter } from 'node:events';
import type { Argument, Command, Option } from 'commander';
import { helpTextConfigFor } from '../help-text.js';
import type { HelpTextConfig } from '../help-text.js';
import { collectRepeated } from './command-options.js';
import { buildCommandPath, visibleChildren } from './command-tree.js';

export interface OptionDescription {
  flags: string;
  long: string | null;
  short: string | null;
  description: string;
  /** Value placeholder from the flags, e.g. `<number>` or `[sha]`. */
  argument: string | null;
  required: boolean;
  repeatable: boolean;
  /** Commander's parsed default; `null` when the flag has none. */
  default: unknown;
  /** Human-readable default from the help text, e.g. `current git branch`. */
  defaultDescription: string | null;
  choices: string[] | null;
}

export interface ArgumentDescription {
  name: string;
  description: string;
  required: boolean;
  variadic: boolean;
  choices: string[] | null;
}

export interface CommandDescription {
  /** Space-joined path below `bb`, e.g. `pr comments list`. */
  path: string;
  description: string;
  usage: string;
  aliases: string[];
  subcommands: string[];
  arguments: ArgumentDescription[];
  options: OptionDescription[];
  examples: string[];
}

export interface CommandManifest {
  globalOptions: OptionDescription[];
  commands: CommandDescription[];
}

/**
 * Describe `command` and every visible command below it, depth-first in help
 * order. The root's options are reported once as `globalOptions` because
 * every subcommand inherits them.
 */
export function describeCommandTree(command: Command): CommandManifest {
  let root = command;
  while (root.parent) root = root.parent;
  return {
    globalOptions: describeOptions(root, helpConfig(root)),
    commands: command === root ? childTrees(root) : describeSubtree(command),
  };
}

/** Commands without subcommands: the ones that actually do something. */
export function leafCommands(manifest: CommandManifest): CommandDescription[] {
  return manifest.commands.filter((cmd) => cmd.subcommands.length === 0);
}

function childTrees(command: Command): CommandDescription[] {
  return subcommandsOf(command).flatMap(describeSubtree);
}

function describeSubtree(command: Command): CommandDescription[] {
  return [describeCommand(command), ...childTrees(command)];
}

// Drops Commander's implicit `help [command]`, which is not a real command.
function subcommandsOf(command: Command): Command[] {
  return visibleChildren(command).filter((child) =>
    command.commands.includes(child)
  );
}

function describeCommand(command: Command): CommandDescription {
  const path = buildCommandPath(command);
  const config = helpConfig(command);
  return {
    path,
    description: command.description(),
    usage: `bb ${path} ${command.usage()}`,
    aliases: command.aliases(),
    subcommands: subcommandsOf(command).map((child) => child.name()),
    arguments: command.registeredArguments.map(describeArgument),
    options: describeOptions(command, config),
    examples: config?.examples ?? [],
  };
}

function describeArgument(argument: Argument): ArgumentDescription {
  return {
    name: argument.name(),
    description: argument.description,
    required: argument.required,
    variadic: argument.variadic,
    choices: argument.argChoices ?? null,
  };
}

function describeOptions(
  command: Command,
  config: HelpTextConfig | undefined
): OptionDescription[] {
  return command.options
    .filter((option) => !option.hidden)
    .map((option) => describeOption(option, config?.defaults));
}

function describeOption(
  option: Option,
  helpDefaults: Record<string, string> | undefined
): OptionDescription {
  // A `--no-x` option's implicit default (`true`) describes `x`, not the flag.
  const ownDefault = option.negate ? undefined : option.defaultValue;
  const helpDefault = option.long
    ? helpDefaults?.[option.long.replace(/^--/, '')]
    : undefined;
  return {
    flags: option.flags,
    long: option.long ?? null,
    short: option.short ?? null,
    description: option.description,
    argument: /[<[][^>\]]*[>\]]/.exec(option.flags)?.[0] ?? null,
    required: option.mandatory,
    repeatable: option.variadic || option.parseArg === collectRepeated,
    default: ownDefault ?? null,
    defaultDescription: helpDefault ?? null,
    choices: option.argChoices ?? null,
  };
}

/**
 * Recover the structured config behind a command's `addHelpText('after')`
 * text by replaying Commander's help listeners into a buffer.
 */
function helpConfig(command: Command): HelpTextConfig | undefined {
  // Command extends EventEmitter at runtime; Commander's typings omit it.
  const emitter = command as unknown as EventEmitter;
  for (const listener of emitter.listeners('afterHelp')) {
    let written = '';
    listener({
      error: false,
      command,
      write: (text: string) => {
        written += text;
      },
    });
    // Commander appends a newline to the text it was given.
    const config = helpTextConfigFor(written.replace(/\n$/, ''));
    if (config) return config;
  }
  return undefined;
}
