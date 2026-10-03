#!/usr/bin/env bun
// Verifies every leaf command in the live CLI tree has a `bb <path>` heading
// under docs/src/content/docs/commands/, that each of its own flags appears in
// that section, and that every global flag appears in the global flags
// reference. Reads the tree through describeCommandTree(), the same dump
// `bb help --json` prints.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  describeCommandTree,
  leafCommands,
} from '../src/core/command-manifest.js';
import type { CommandManifest } from '../src/core/command-manifest.js';

/**
 * Every `## \`bb <path>\`` section (any heading level) in `markdown`, keyed by
 * path and merged into `into`. One heading may name several commands
 * (`## \`bb pr approve\`, \`bb pr ready\``). A section runs until the next
 * heading at the same or a higher level; `#` lines inside fenced code blocks
 * are shell comments, not headings.
 */
export function collectCommandSections(
  markdown: string,
  into: Map<string, string[]> = new Map()
): Map<string, string[]> {
  let inFence = false;
  let open: { paths: string[]; level: number; lines: string[] } | undefined;
  const close = (): void => {
    if (!open) return;
    for (const path of open.paths) {
      into.set(path, [...(into.get(path) ?? []), open.lines.join('\n')]);
    }
    open = undefined;
  };
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = inFence ? null : /^(#{1,6}) (.*)$/.exec(line);
    if (heading && open && heading[1]!.length <= open.level) close();
    if (heading && /^(`bb [^`]+`[\s,/]*)+$/.test(heading[2]!)) {
      close();
      const paths = [...heading[2]!.matchAll(/`bb ([^`]+)`/g)].map(
        (m) => m[1]!
      );
      open = { paths, level: heading[1]!.length, lines: [] };
    }
    open?.lines.push(line);
  }
  close();
  return into;
}

function mentionsFlag(text: string, flag: string): boolean {
  return new RegExp(`${flag}(?![\\w-])`).test(text);
}

/** Human-readable drift problems; empty when the docs cover the tree. */
export function findCommandDocProblems(
  manifest: CommandManifest,
  sections: Map<string, string[]>,
  globalFlagsDoc: string
): string[] {
  const problems: string[] = [];
  for (const command of leafCommands(manifest)) {
    const text = sections.get(command.path)?.join('\n');
    if (text === undefined) {
      problems.push(`bb ${command.path}: no \`bb ${command.path}\` heading`);
      continue;
    }
    for (const option of command.options) {
      const flag = option.long ?? option.short;
      if (flag && !mentionsFlag(text, flag)) {
        problems.push(`bb ${command.path}: ${flag} is not documented`);
      }
    }
  }
  for (const option of manifest.globalOptions) {
    const flag = option.long ?? option.short;
    if (flag && !mentionsFlag(globalFlagsDoc, flag)) {
      problems.push(`global flag ${flag} is not documented`);
    }
  }
  return problems;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith('.mdx')) yield full;
  }
}

if (import.meta.main) {
  const { cli } = await import('../src/cli.js');
  const repoRoot = resolve(import.meta.dir, '..');
  const commandsDir = resolve(repoRoot, 'docs/src/content/docs/commands');
  const globalFlagsPath = resolve(
    repoRoot,
    'docs/src/content/docs/reference/global-flags.mdx'
  );

  const sections = new Map<string, string[]>();
  for (const file of walk(commandsDir)) {
    collectCommandSections(readFileSync(file, 'utf8'), sections);
  }
  const manifest = describeCommandTree(cli);
  const problems = findCommandDocProblems(
    manifest,
    sections,
    readFileSync(globalFlagsPath, 'utf8')
  );

  if (problems.length > 0) {
    console.error('command-docs-check: undocumented commands or flags\n');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      `\nDocument them under ${relative(repoRoot, commandsDir)}/ (global flags in ${relative(repoRoot, globalFlagsPath)}).`
    );
    process.exit(1);
  }

  console.log(
    `command-docs-check: ok (${leafCommands(manifest).length} commands documented)`
  );
}
