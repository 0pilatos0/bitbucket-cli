# AGENTS.md

This repository is a Bun-based, ESM TypeScript CLI for Bitbucket Cloud.
Agents should follow the existing command and DI patterns and keep edits aligned
with the current conventions.

## Commands

```bash
# Dependencies
bun install

# CLI
bun run dev          # Run CLI in dev mode (executes src/index.ts)
bun run build        # Build CLI to dist/

# Tests
bun test             # Run all tests
bun test <file>      # Run a single test file (e.g., bun test tests/commands/repo.test.ts)

# Type-checking / formatting
bun run lint         # Type-check with tsc --noEmit
bun run format       # Prettier write
bun run format:check # Prettier check

# Generated API
bun run generate:api # Regenerate src/generated/ from the pinned spec
bun run check:api-contract # Regenerate and fail if src/generated/ drifts (CI gate)
bun run check:api-updates # Check if the pinned spec has an upstream update (0=current, 1=update, 2=unverifiable)
bun run update:api # Download the latest spec, regenerate src/generated/, restore the old spec if generation fails

# Docs site (Astro, in docs/)
bun run docs:dev     # Start docs dev server
bun run docs:build   # Build docs

# Release helpers
bun run changeset
bun run version
bun run release
```

## Repository Layout

- `src/index.ts` entrypoint (Bun shebang; runtime guard)
- `src/cli.ts` Commander CLI wiring and option parsing
- `src/bootstrap.ts` dependency injection registrations
- `src/core/**` DI container, base command, interfaces
- `src/commands/**` command implementations (`*.command.ts`)
- `src/services/**` service implementations (preferred helpers live here)
- `src/types/**` shared types and error definitions
- `src/generated/**` OpenAPI client (auto-generated; do not edit)
- `tests/**` Bun tests mirroring src structure
- `docs/**` docs site (Astro)

## Code Style Guidelines

### Runtime and modules

- Bun only; `src/index.ts` guards against non-Bun runtimes
- Package is ESM (`"type": "module"`); always use ESM imports
- Imports in `.ts` files use `.js` extensions
- Prefer `node:`-prefixed builtins (e.g., `node:path`, `node:fs/promises`)

### Imports

- Order: Node builtins, third-party, then local modules
- Use `import type { ... }` for type-only imports
- Export types with `export type { ... }` when re-exporting
- Keep imports explicit; avoid barrel exports for commands

### Formatting

- Prettier is the source of truth
- 2-space indentation, single quotes, semicolons
- Print width 80, trailing commas `es5`, end of line `lf`
- No trailing whitespace

### Types

- TypeScript `strict` is enabled
- Use explicit return types on public methods
- Avoid `any`; prefer `unknown` and narrow
- Prefer interfaces for public APIs and types for internal structures
- Use `Array.from()` when converting `values` from generated API responses
- Be explicit when parsing `string` options to numbers (`Number.parseInt`)

### Naming Conventions

- Classes: PascalCase (e.g., `ConfigService`, `ListReposCommand`)
- Functions/Methods: camelCase (e.g., `execute`, `getConfig`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- Service interfaces in `src/core/interfaces/services.ts` use `I` prefix (e.g., `IConfigService`)
- Other interfaces follow existing local style (e.g., `CommandContext`, `CommandMetadata`)
- Private members use descriptive camelCase names by default; keep `_name` only when matching existing class style
- Type parameters: single uppercase letter (e.g., `T`, `E`, `R`)

### Error Handling

- Use `BBError` and `ErrorCode` from `src/types/errors.ts` for expected failures
- API errors are normalized in `src/services/api-client.service.ts` to `APIError`
- Let `BaseCommand.run()` handle top-level command errors (text/JSON rendering and exit code)
- Use command-level `try/catch` only when adding context, fallback behavior, or cleanup before rethrowing
- `handleError()` in `BaseCommand` sets `process.exitCode` except in tests
- Use `requireOption()` from `BaseCommand` for required CLI options
- Only throw for exceptional cases; CLI is responsible for exit behavior

### Command Pattern

- Commands extend `BaseCommand<TOptions, TResult>`
- Implement `name`, `description`, and `execute()` returning `Promise<TResult>`
- Inject dependencies via constructor; avoid service locators in commands
- `CommandContext` carries `globalOptions` (workspace/repo/json)
- Use `withGlobalOptions()` when merging per-command options
- Prefer `ContextService.requireRepoContext()` for workspace/repo resolution

### Output and JSON

- Use `IOutputService` for all CLI output; avoid `console.*` in commands
- Respect `context.globalOptions.json` and option-level `json` flags
- For JSON output, call `output.json()` and return early
- Use `output.table()` for aligned tabular output
- Use `output.info/success/warning/error` for user-facing messaging

### Dependency Injection

- Register services and commands in `src/bootstrap.ts` with `ServiceTokens`
- Container is a singleton; tests reset it in `tests/setup.ts`
- Services are singletons by default (override via options if needed)

### Testing

- Use Bun test runner (`bun:test`)
- Single test file: `bun test tests/commands/<name>.test.ts`
- Test files: `<name>.test.ts` or `<name>.expanded.test.ts`
- Mocks/utilities live in `tests/setup.ts` (container reset hooks included)
- Prefer descriptive test names focused on behavior

### Generated Code

- `src/generated/**` is auto-generated; avoid manual edits
- The pinned spec `specs/bitbucket-cloud.json` is committed; `bun run generate:api` normalizes it via `scripts/normalize-spec.ts` (fixing upstream warts at the spec level) into a gitignored copy, then generates
- Prefer spec-level fixes in `scripts/normalize-spec.ts` over output-level patches in `scripts/patch-generated.ts`
- `.github/workflows/check-api-updates.yml` runs `check:api-updates` weekly and opens an issue when upstream drifts

### Security and Config

- Never log or commit secrets (tokens, passwords)
- Config path is platform-aware:
  - Linux/macOS: `~/.config/bb/config.json`
  - Windows: `%APPDATA%\\bb\\config.json` (fallback `%USERPROFILE%\\AppData\\Roaming\\bb\\config.json`)
- Config writes use `0o600` permissions where supported
- Avoid printing sensitive config values to output
- API auth uses Basic auth via `ConfigService.getCredentials()`

## Tooling Notes

- Git hook: `simple-git-hooks` runs `bun run format:check` on pre-commit
- Runtime: Bun only (`src/index.ts` guards against non-Bun runtimes)
