/**
 * User-defined command aliases (issue #275), mirroring `gh alias`.
 *
 * Aliases live in the existing `config.json` under an `aliases` map and are
 * expanded by rewriting argv BEFORE `cli.js` is imported — the CLI module
 * reads `process.argv` at load time (color/locale/completion resolution), so
 * expansion cannot happen later. `src/index.ts` owns that ordering.
 *
 * Two alias forms, matching `gh`:
 *  - Command alias: `co` → `pr checkout $1`. The expansion is split into
 *    shell-style words; `$1`–`$9` placeholders are filled from the arguments
 *    following the alias, and any leftover arguments are appended.
 *  - Shell alias: a `!` prefix (`igrep` → `!bb issue list --json | grep $1`)
 *    runs the body via `sh -c` with the remaining argv as shell positional
 *    parameters, so `$1`/`$@` behave exactly as in a shell script.
 *
 * Expansion is a single level deep: an alias body is never re-expanded, so
 * aliases cannot reference each other or recurse.
 */

import { ConfigService } from './services/config.service.js';
import { BBError, ErrorCode } from './types/errors.js';

/**
 * Built-in top-level command names that an alias may never shadow. Expansion
 * also skips these, so a stale alias from an older config can never hijack a
 * command added in a newer release. Kept in sync with the live Commander tree
 * by a drift test (tests/alias.test.ts) — add the command here when adding a
 * top-level command.
 */
export const RESERVED_COMMAND_NAMES = [
  'auth',
  'repo',
  'pr',
  'snippet',
  'pipeline',
  'commit',
  'status',
  'issue',
  'workspace',
  'project',
  'browse',
  'api',
  'config',
  'completion',
  'alias',
  'help',
] as const;

const ALIAS_NAME_PATTERN = /^[a-z][a-z0-9_-]*$/i;

export function isValidAliasName(name: string): boolean {
  return ALIAS_NAME_PATTERN.test(name);
}

export function isReservedCommandName(name: string): boolean {
  return (RESERVED_COMMAND_NAMES as readonly string[]).includes(name);
}

/** A shell alias delegates its body to `sh -c` instead of expanding argv. */
export function isShellAlias(expansion: string): boolean {
  return expansion.startsWith('!');
}

export type AliasExpansion =
  | { kind: 'none' }
  | { kind: 'argv'; argv: string[] }
  | { kind: 'shell'; command: string; args: string[] };

/**
 * Split an alias expansion into words the way a POSIX shell tokenizes a
 * command line: whitespace separates words; single quotes preserve everything
 * literally; double quotes preserve everything except `\"` and `\\` escapes;
 * an unquoted backslash escapes the next character. Throws on an unclosed
 * quote so a broken alias fails loudly at definition/expansion time instead
 * of silently mangling arguments.
 */
export function splitShellWords(input: string): string[] {
  const words: string[] = [];
  let current = '';
  let hasWord = false;
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as string;

    if (quote === "'") {
      if (ch === "'") {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (quote === '"') {
      if (ch === '"') {
        quote = null;
      } else if (
        ch === '\\' &&
        (input[i + 1] === '"' || input[i + 1] === '\\')
      ) {
        current += input[++i];
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      hasWord = true;
    } else if (ch === '\\' && i + 1 < input.length) {
      current += input[++i];
      hasWord = true;
    } else if (/\s/.test(ch)) {
      if (hasWord) {
        words.push(current);
        current = '';
        hasWord = false;
      }
    } else {
      current += ch;
      hasWord = true;
    }
  }

  if (quote) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: `Alias expansion has an unclosed ${quote === "'" ? 'single' : 'double'} quote.`,
      context: { expansion: input },
    });
  }

  if (hasWord) {
    words.push(current);
  }
  return words;
}

/**
 * Read the alias map from the user's config. Expansion runs before bootstrap,
 * so this constructs its own (read-only) ConfigService rather than resolving
 * the DI singleton. Best-effort: an unreadable or invalid config yields an
 * empty map so alias expansion can never break the CLI — the actual command
 * will surface the config error through the normal error path if it needs
 * the config itself.
 */
export async function loadAliases(): Promise<Record<string, string>> {
  try {
    const config = await new ConfigService().getConfig();
    return config.aliases ?? {};
  } catch {
    return {};
  }
}

const PLACEHOLDER_PATTERN = /\$([1-9])/g;

/**
 * Fill `$1`–`$9` placeholders in the expansion words from `args` and append
 * any arguments no placeholder consumed. Throws when the expansion references
 * a placeholder the caller didn't supply, naming the alias for a clear error.
 */
export function substitutePlaceholders(
  words: string[],
  args: string[],
  aliasName: string
): string[] {
  let highestUsed = 0;

  const substituted = words.map((word) =>
    word.replace(PLACEHOLDER_PATTERN, (_match, digit: string) => {
      const index = Number.parseInt(digit, 10);
      const value = args[index - 1];
      if (value === undefined) {
        throw new BBError({
          code: ErrorCode.VALIDATION_REQUIRED,
          message: `Alias '${aliasName}' requires argument $${index}.`,
          context: { alias: aliasName, placeholder: index },
        });
      }
      highestUsed = Math.max(highestUsed, index);
      return value;
    })
  );

  return [...substituted, ...args.slice(highestUsed)];
}

/**
 * Expand a user alias in `argv` (the raw `process.argv`, binary and script
 * tokens included). Returns what the entrypoint should do next:
 *  - `none`  — argv untouched (no alias present, or the token is reserved)
 *  - `argv`  — parse the rewritten argv with Commander
 *  - `shell` — run `command` via `sh -c` with `args` as positional parameters
 */
export function expandAliasArgv(
  argv: string[],
  aliases: Record<string, string>
): AliasExpansion {
  const candidate = argv[2];
  if (
    candidate === undefined ||
    candidate.startsWith('-') ||
    isReservedCommandName(candidate)
  ) {
    return { kind: 'none' };
  }

  const expansion = aliases[candidate];
  if (expansion === undefined) {
    return { kind: 'none' };
  }

  const args = argv.slice(3);

  if (isShellAlias(expansion)) {
    return { kind: 'shell', command: expansion.slice(1), args };
  }

  const words = substitutePlaceholders(
    splitShellWords(expansion),
    args,
    candidate
  );
  return { kind: 'argv', argv: [...argv.slice(0, 2), ...words] };
}
