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
