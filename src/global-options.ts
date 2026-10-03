/**
 * Flags declared on the root `bb` program and honoured by every subcommand.
 * Shared with the command-tree snapshot test so subcommand help there shows
 * the same "Global Options:" section users see.
 */

import type { Command } from 'commander';

export function addGlobalOptions(program: Command): Command {
  return program
    .option(
      '--json [fields]',
      'Output as JSON; optionally project to a comma-separated field list (e.g. number,title,author.display_name)'
    )
    .option(
      '--jq <expression>',
      'Filter the JSON output through a jq expression — runs in-process via embedded jq, requires --json (e.g. \'.pullRequests[] | select(.state == "OPEN") | .title\')'
    )
    .option('--no-color', 'Disable color output')
    .option(
      '--no-unicode',
      'Use ASCII fallbacks for symbols (separators, arrows, status icons) — also enabled by BB_NO_UNICODE'
    )
    .option(
      '--no-truncate',
      'Show full values in table output without truncation'
    )
    .option(
      '--no-input',
      'Never prompt, even in an interactive terminal, except in completion install (also enabled by BB_PROMPT_DISABLED)'
    )
    .option(
      '--locale <locale>',
      'BCP-47 locale tag for date/time formatting (e.g. de-DE, ja-JP). Falls back to BB_LOCALE, then LC_TIME/LC_ALL/LANG, then en-US.'
    )
    .option(
      '-w, --workspace <workspace>',
      'Specify workspace (falls back to BB_WORKSPACE, then config defaultWorkspace)'
    )
    .option('-r, --repo <repo>', 'Specify repository');
}
