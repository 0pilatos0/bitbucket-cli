#!/usr/bin/env bun

// Type-only: erased at runtime, so nothing is loaded before argv is rewritten.
import type { IOutputService } from './core/interfaces/services.js';

// Top-level await below requires module context; this file has no static
// imports (cli.js must load only after argv is rewritten), so mark it a
// module explicitly.
export {};

// Runtime check: Ensure Bun runtime is being used
if (typeof Bun === 'undefined') {
  console.error('Error: This CLI requires the Bun runtime.');
  console.error('Please install Bun: https://bun.sh');
  console.error('');
  console.error('Installation: curl -fsSL https://bun.sh/install | bash');
  process.exit(1);
}

// User-alias expansion must rewrite process.argv BEFORE cli.js is imported:
// that module resolves --no-color/--locale/completion from argv at load time.
// Shell completion (tabtab) is driven by COMP_LINE, not argv, and must stay
// fast — skip expansion entirely there.
const isCompleting =
  process.env.COMP_LINE !== undefined ||
  process.argv.includes('--get-yargs-completions');

if (!isCompleting) {
  const { expandAliasArgv, loadAliases } = await import('./alias.js');
  try {
    const expansion = expandAliasArgv(process.argv, await loadAliases());
    if (expansion.kind === 'shell') {
      // `!`-prefixed alias: hand the body to sh with the remaining argv as
      // shell positional parameters ($0 is the conventional command label),
      // then exit with the child's status — Commander never runs.
      const result = Bun.spawnSync(
        ['sh', '-c', expansion.command, 'bb-alias', ...expansion.args],
        { stdio: ['inherit', 'inherit', 'inherit'] }
      );
      process.exit(result.exitCode);
    }
    if (expansion.kind === 'argv') {
      process.argv = expansion.argv;
    }
  } catch (error) {
    // Route through IOutputService per the output contract. The module is
    // imported lazily: this file must not import cli.js (or anything that
    // pulls it in) before argv is rewritten.
    const { OutputService } = await import('./services/output.service.js');
    const output: IOutputService = new OutputService();
    output.error(
      error instanceof Error ? `Error: ${error.message}` : String(error)
    );
    process.exit(1);
  }
}

const { cli } = await import('./cli.js');

// parseAsync (not parse) so Commander awaits async action handlers and the
// postAction update-check hook before the process exits.
await cli.parseAsync(process.argv);
