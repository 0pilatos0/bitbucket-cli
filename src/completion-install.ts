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
import tabtab from 'tabtab/lib/index.js';
import {
  writeToShellConfig,
  writeToTabtabScript,
} from 'tabtab/lib/installer.js';
import promptForLocation from 'tabtab/lib/prompt.js';
import bashTemplate from 'tabtab/lib/scripts/bash.sh' with { type: 'text' };
import fishTemplate from 'tabtab/lib/scripts/fish.sh' with { type: 'text' };
import zshTemplate from 'tabtab/lib/scripts/zsh.sh' with { type: 'text' };
import systemShell from 'tabtab/lib/utils/systemShell.js';
import powershellTemplate from './completion-powershell.ps1' with { type: 'text' };

export interface CompletionTarget {
  name: string;
  completer: string;
}

/** Shells `bb completion <shell>` can print a script for. */
export const COMPLETION_SHELLS = ['bash', 'zsh', 'fish', 'powershell'] as const;
export type CompletionShell = (typeof COMPLETION_SHELLS)[number];

const TEMPLATES: Record<CompletionShell, string> = {
  bash: bashTemplate,
  fish: fishTemplate,
  zsh: zshTemplate,
  powershell: powershellTemplate,
};

function isCompletionShell(shell: string): shell is CompletionShell {
  return (COMPLETION_SHELLS as readonly string[]).includes(shell);
}

/**
 * Renders the completion script for `shell`; unknown shells get bash. tabtab's
 * templates call the completer without naming their shell, so the output
 * format would follow `$SHELL` instead of the shell that loaded the script;
 * prefix the call with BB_COMPLETION_SHELL (the PowerShell template sets it
 * itself).
 */
export function renderCompletionScript(
  shell: string,
  { name, completer }: CompletionTarget
): string {
  const key = isCompletionShell(shell) ? shell : 'bash';
  return TEMPLATES[key]
    .replace(/\{completer\} completion --/g, `BB_COMPLETION_SHELL=${key} $&`)
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
