#!/usr/bin/env bun

// Runtime check: Ensure Bun runtime is being used
if (typeof Bun === 'undefined') {
  console.error('Error: This CLI requires the Bun runtime.');
  console.error('Please install Bun: https://bun.sh');
  console.error('');
  console.error('Installation: curl -fsSL https://bun.sh/install | bash');
  process.exit(1);
}

import { cli } from './cli.js';

// parseAsync (not parse) so Commander awaits async action handlers and the
// postAction update-check hook before the process exits.
await cli.parseAsync(process.argv);

// Exit explicitly. On Windows, handles left behind by libraries the command
// touched — e.g. jq-wasm's Emscripten runtime (noExitRuntime) or an HTTP
// keep-alive socket — can keep the process alive after the command has
// finished, so `bb ... --jq` would hang forever (issue #309). parseAsync
// resolves only once every action and postAction hook has settled, so there
// is no pending work left; process.exitCode carries the error status set by
// BaseCommand.handleError.
process.exit(process.exitCode ?? 0);
