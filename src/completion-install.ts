/**
 * Shell-completion install and uninstall. Install is equivalent to
 * `tabtab.install()` except for where the per-shell script templates come from.
 *
 * tabtab reads its templates from `path.join(__dirname, 'scripts/<shell>.sh')`
 * at install time. Once tabtab is bundled (as it must be inside a
 * `bun build --compile` binary), `__dirname` is frozen to the build machine's
 * node_modules path, so the read fails on every other machine and tabtab only
 * logs the ENOENT: the install "succeeds" without writing the completion
 * script. Importing the templates as text embeds them in the bundle instead.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import tabtab from 'tabtab';
import { writeToShellConfig, writeToTabtabScript } from 'tabtab/lib/installer';
import promptForLocation from 'tabtab/lib/prompt';
import bashTemplate from 'tabtab/lib/scripts/bash.sh' with { type: 'text' };
import fishTemplate from 'tabtab/lib/scripts/fish.sh' with { type: 'text' };
import zshTemplate from 'tabtab/lib/scripts/zsh.sh' with { type: 'text' };
import systemShell from 'tabtab/lib/utils/systemShell';

export interface CompletionTarget {
  name: string;
  completer: string;
}

const TEMPLATES: Record<string, string> = {
  bash: bashTemplate,
  fish: fishTemplate,
  zsh: zshTemplate,
};

/** Renders tabtab's completion script for `shell`; unknown shells get bash. */
export function renderCompletionScript(
  shell: string,
  { name, completer }: CompletionTarget
): string {
  return (TEMPLATES[shell] ?? bashTemplate)
    .replace(/\{pkgname\}/g, name)
    .replace(/\{completer\}/g, completer)
    .replace(/\r?\n/g, '\n');
}

/**
 * Mirrors tabtab's layout: the script lives in `~/.config/tabtab` and is named
 * after `$SHELL` (not the prompted shell), which `tabtab.uninstall()` relies on.
 */
export async function installCompletion(
  target: CompletionTarget,
  homeDir: string = homedir()
): Promise<void> {
  const { location } = await promptForLocation();
  const shell = systemShell();
  const scriptPath = join(
    homeDir,
    '.config',
    'tabtab',
    `${target.name}.${shell}`
  );

  await writeToShellConfig({ location, name: target.name });
  await writeToTabtabScript({ name: target.name });
  await mkdir(dirname(scriptPath), { recursive: true });
  await writeFile(scriptPath, renderCompletionScript(shell, target));
}

export async function uninstallCompletion(name: string): Promise<void> {
  await tabtab.uninstall({ name });
}
