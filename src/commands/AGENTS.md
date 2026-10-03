# Adding a command

Conventions live in the root [AGENTS.md](../../AGENTS.md). This page is the
end-to-end checklist for one new `bb <group> <verb>` command.

## Scaffold

```bash
bun run new:command <group> <verb>                          # e.g. snippet star
bun run new:command <group> list --list --wrapper-key tags  # paginated list
bun run new:command <group> <verb> --dry-run
```

`--description <text>` sets the help line. `--wrapper-key` names the JSON
array of a `--list` command; it is a public contract, so it is never guessed.

The script checks the real command tree first, so it refuses a verb or
nested group that already exists, a top-level leaf command (`bb browse`) used
as a group, and anything it would overwrite. It changes no file when a check
fails and rolls back if a write fails. It does steps 1 to 6 and 8 below with
`TODO(scaffold)` placeholders, then prints what is left for this command.
Nested groups (`pr comments add`) are not scaffolded; follow the checklist by
hand.

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
   `registrar.runWithGlobalOptions()`. A new group also gets:
   - its own `register.ts` plus an entry in `TOP_LEVEL_COMMANDS`
     (`src/commands/register.ts`), whose order is the `bb --help` order;
   - an entry in `RESERVED_COMMAND_NAMES` (`src/alias.ts`);
   - an entry in the pinned top-level lists in `tests/cli.test.ts` and
     `tests/commands/register.test.ts`.
5. **List commands** add the JSON array key to `WRAPPER_ARRAY_KEYS`
   (`src/services/output.service.ts`, before `values`) and to both tables in
   `tests/cli-completion-drift.test.ts`. `runList()` throws on an
   unregistered key.
6. **Tests** in `tests/commands/`, using the mocks in `tests/setup.ts`.
7. **Pinned lists** the group's subcommand list in `tests/cli.test.ts`, if
   it has one, and the help snapshot:
   `bun test --update-snapshots tests/commands/register.test.ts`, then review
   the snapshot diff.
8. **Docs** a section in `docs/src/content/docs/commands/<group>.mdx`, or on
   the right page when the group is a folder (`commands/pr/`). A new group
   also needs a sidebar entry in `docs/astro.config.mjs`, a row in the README
   command table and in `docs/src/components/CommandIndex.astro`.
9. **Reference docs** a new wrapper key goes in `reference/json-output.mdx`,
   a new `ErrorCode` in `reference/error-codes.mdx` and a new env var in
   `reference/environment-variables.mdx` (`bun run lint:docs` enforces the
   last two). New token scopes go in `reference/token-scopes.mdx`.
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
