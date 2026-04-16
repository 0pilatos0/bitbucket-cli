# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

See @AGENTS.md for full coding conventions, DI patterns, and command architecture.

## Commands

```bash
bun test                             # Run all tests
bun test tests/commands/foo.test.ts  # Single test file
bun run lint                         # Type-check (tsc --noEmit)
bun run format                       # Prettier write
bun run format:check                 # Prettier check (runs on pre-commit)
bun run build                        # Build CLI to dist/
bun run generate:api                 # Regenerate src/generated/ from OpenAPI spec
```

## Key Rules

- **Bun only** — Node.js is not supported; the entrypoint guards against it
- **ESM imports must use `.js` extensions** (e.g., `import { foo } from './bar.js'`)
- **Never edit `src/generated/`** — regenerate with `bun run generate:api`
- **Changesets required** for user-facing changes: run `bun run changeset` and commit the file
- **Branch naming**: `feat/description` or `fix/description`
- **Use `IOutputService`** for all output — never `console.*`
- **Use `BBError`/`ErrorCode`** for expected failures — let `BaseCommand.run()` handle top-level errors
