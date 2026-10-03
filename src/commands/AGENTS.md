# Adding a command

Conventions live in the root [AGENTS.md](../../AGENTS.md). This page is the
end-to-end checklist for one new `bb <group> <verb>` command.

## Scaffold

```bash
bun run new:command <group> <verb>          # e.g. snippet star
bun run new:command <group> list --list     # paginated list command
bun run new:command <group> <verb> --dry-run
```

Options: `--description <text>` sets the help line, and `--wrapper-key <key>`
overrides the JSON array key for `--list` (default: `<group>s` in camelCase,
e.g. `branch-restriction` becomes `branchRestrictions`).

The script refuses to overwrite anything and changes no file when it fails.
It does steps 1 to 6 below with `TODO(scaffold)` placeholders, then prints
what is left. Nested groups (`pr comments add`) and top-level leaf commands
(`bb browse`) are not scaffolded; follow the checklist by hand.

## Checklist

1. **Command** `src/commands/<group>/<verb>.command.ts`: extend
   `BaseCommand<TOptions, TResult>`, inject the generated API client and
   services through the constructor.
2. **Token** `ServiceTokens.<Class>` in `src/core/container.ts`.
3. **Wiring** an import and a `registerCommand(...)` call in
   `src/bootstrap.ts`. The deps array is positional and must match the
   constructor; `tests/core/bootstrap.test.ts` checks the count.
4. **Commander** a `.command('<verb>')` block in
   `src/commands/<group>/register.ts`, dispatching through
   `registrar.runWithGlobalOptions()`. A new group also gets its own
   `register.ts` plus an entry in `TOP_LEVEL_COMMANDS`
   (`src/commands/register.ts`), whose order is the `bb --help` order.
5. **List commands** add the JSON array key to `WRAPPER_ARRAY_KEYS`
   (`src/services/output.service.ts`, before `values`) and to both tables in
   `tests/cli-completion-drift.test.ts`. `runList()` throws on an
   unregistered key.
6. **Tests** in `tests/commands/`, using the mocks in `tests/setup.ts`.
7. **Help snapshot** `bun test --update-snapshots tests/commands/register.test.ts`,
   then review the snapshot diff.
8. **Docs** a section in `docs/src/content/docs/commands/<group>.mdx`. A new
   group page also needs a sidebar entry in `docs/astro.config.mjs`.
9. **Reference docs** a new `ErrorCode` goes in `reference/error-codes.mdx`
   and a new env var in `reference/environment-variables.mdx`
   (`bun run lint:docs` enforces both). New token scopes go in
   `reference/token-scopes.mdx`.
10. **Changeset** `bun run changeset` (`minor` for a new command).
11. **Verify** `bun run lint && bun run lint:docs && bun test && bun run format:check`.

## BaseCommand helpers

| Helper                                       | Use it for                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `runList(spec, context)`                     | Paginated lists: `--limit`/`--all`, JSON envelope, table, empty state          |
| `requireOption(value, name)`                 | A required flag (`VALIDATION_REQUIRED` with a `--help` hint)                   |
| `parsePositiveInt(value, name)`              | IDs, counts and limits; strict, rejects `1abc`                                 |
| `parseIntOption(value, name)`                | Any integer flag                                                               |
| `parseEnumOption(value, name, allowed)`      | Enum flags, with a "did you mean" suggestion                                   |
| `requireConfirmation(yes, warning, context)` | Destructive actions: prompts in a TTY, otherwise demands `--yes`               |
| `truncateText(text, max, globalOptions)`     | Table cells; honours `--no-truncate`                                           |
| `printMoreHint(shown, hasMore, noun)`        | Footer when a hand-rolled list was capped                                      |
| `appendHelpHint(message)`                    | Point a validation error at `bb <path> --help`                                 |
| `suppressNotFoundHint = true`                | Opt out of the generic 404 hint when the user typed the resource path directly |

From `IContextService`: `requireRepoContextFor(options, context)` for
repository commands, `resolveWorkspaceFor(options, context)` for workspace
commands. From `src/types/errors.ts`: `BBError` / `ErrorCode` for expected
failures and `rethrowWithNotFoundContext()` to name the missing resource in a 404.
