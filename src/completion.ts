/**
 * Shell-completion candidate generation, derived from the live Commander tree.
 *
 * Replaces the hand-maintained `ROOT_COMPLETIONS` / `SUBCOMMAND_COMPLETIONS` /
 * `COMMENTS_SUBCOMMANDS` tables (issue #256): walking the real command tree is
 * a single source of truth, so adding a command or flag updates completion
 * automatically, and nested groups that share a name (`pr comments` vs
 * `snippet comments`) disambiguate structurally instead of by special-casing.
 *
 * It also surfaces flag-value completion: an enum option whose allowed values
 * were advertised via `withCompletionChoices` (e.g. `--state`, `--strategy`,
 * `--role`, `--color`, `-X`) — read here off `option.argChoices` — suggests
 * those values when the cursor sits right after the flag. Validation itself
 * stays in the command handlers, so this is completion-only.
 */

import type { Command, Option } from 'commander';

/**
 * A completion candidate. `tabtab.log()` accepts either bare strings or
 * `{ name, description }` objects; the description is surfaced by zsh and fish
 * (and ignored by bash), so returning objects makes completions
 * self-documenting at no cost.
 */
export interface CompletionItem {
  name: string;
  description?: string;
}

/**
 * The slice of tabtab's parsed env we rely on. `partial` is the text to the
 * left of the cursor (equal to `line` for an end-of-line TAB); we prefer it so
 * completion is correct even mid-line.
 */
export interface CompletionEnv {
  line?: string;
  partial?: string;
}

/**
 * Find the option matching a flag token (`--long` or `-s`) on the resolved
 * command or any of its ancestors — ancestors carry the inherited global flags.
 */
function findOption(
  path: readonly Command[],
  flag: string
): Option | undefined {
  for (const cmd of path) {
    for (const opt of cmd.options) {
      if (opt.long === flag || opt.short === flag) {
        return opt;
      }
    }
  }
  return undefined;
}

/**
 * Produce completion candidates for the current command line by walking the
 * Commander `program` tree. Returns subcommands + applicable option flags, or —
 * when the cursor follows a value-expecting option — that option's choices.
 *
 * Kept deliberately simple: it never tries to complete positional values (PR
 * ids, snippet ids, account ids, file paths). When navigation hits an
 * unrecognized non-flag token it stops and offers the current node's flags.
 */
export function generateCompletions(
  program: Command,
  env: CompletionEnv
): CompletionItem[] {
  const raw = env.partial ?? env.line ?? '';
  const endsWithSpace = /\s$/.test(raw);
  // Strip the leading binary token by POSITION (it may be `bb`, a path, or an
  // alias — never match the literal name).
  const tokens = raw.split(/\s+/).filter(Boolean).slice(1);
  // Tokens that select the command: everything except the word being typed.
  const navTokens = endsWithSpace ? tokens : tokens.slice(0, -1);

  // Walk the tree following non-flag tokens to the deepest matching command.
  let node: Command = program;
  const path: Command[] = [program];
  for (let i = 0; i < navTokens.length; i++) {
    const tok = navTokens[i] as string;
    if (tok.startsWith('-')) {
      // A flag that takes a separate value (`--repo x`, `-w ws`) consumes the
      // next token as its value — skip it so the value isn't mistaken for a
      // positional and abort the walk. `--flag=value` carries its own value.
      if (!tok.includes('=')) {
        const opt = findOption(path, tok);
        if (opt && opt.required) {
          i++;
        }
      }
      continue; // flags and their values never select a command
    }
    const child = node.commands.find(
      (c) => c.name() === tok || c.aliases().includes(tok)
    );
    if (!child) {
      break; // unrecognized positional (e.g. a PR id) — stop walking
    }
    node = child;
    path.push(node);
  }

  // Flag-value completion: when the token immediately before the cursor is an
  // option that requires a value, suggest its choices — or nothing at all, so
  // we don't offer flags/subcommands as if they were the value.
  const prevTok = navTokens.length
    ? navTokens[navTokens.length - 1]
    : undefined;
  if (prevTok && prevTok.startsWith('-')) {
    const opt = findOption(path, prevTok);
    if (opt && opt.required) {
      const choices = opt.argChoices;
      return choices && choices.length
        ? choices.map((value) => ({ name: value }))
        : [];
    }
  }

  const items: CompletionItem[] = [];

  // Subcommands of the resolved node (skip Commander's implicit `help`).
  for (const child of node.commands) {
    if (child.name() === 'help') {
      continue;
    }
    items.push({ name: child.name(), description: child.description() });
  }

  // Option flags from the node and every ancestor (the root carries the global
  // flags). Skip a flag already on the line unless it is repeatable.
  const presentFlags = new Set(navTokens.filter((t) => t.startsWith('-')));
  const seen = new Set<string>();
  for (const cmd of path) {
    for (const opt of cmd.options) {
      const flag = opt.long ?? opt.short;
      if (!flag || seen.has(flag)) {
        continue;
      }
      // `--version` lives on the root program's option list but is only valid
      // on the root invocation; surface it explicitly below, never inherited.
      if (flag === '--version') {
        continue;
      }
      seen.add(flag);
      if (presentFlags.has(flag) && !opt.variadic) {
        continue;
      }
      items.push({ name: flag, description: opt.description });
    }
  }

  // `--help` is available on every command; `--version` only at the root.
  if (!seen.has('--help')) {
    items.push({ name: '--help', description: 'Display help for command' });
  }
  if (node === program && !seen.has('--version')) {
    items.push({ name: '--version', description: 'Output the version number' });
  }

  // De-duplicate by name, keeping the first occurrence (subcommands, then
  // flags in path order). The `seen` set above already prevents duplicate
  // flags across levels, so this only guards against an incidental collision.
  const byName = new Map<string, CompletionItem>();
  for (const item of items) {
    if (!byName.has(item.name)) {
      byName.set(item.name, item);
    }
  }
  return [...byName.values()];
}
