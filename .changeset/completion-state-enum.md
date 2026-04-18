---
'@pilatos/bitbucket-cli': patch
---

refactor(cli): extract PR states constant and collapse completion if/else into a map

Internal-only change — no user-facing behavior change.

- **`PR_STATES` constant**: The literal list `['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']` was written out three times — once in `pr/list.command.ts` as the option validator, once in `cli.ts` as the `--state` description, and once in the help text's `Valid states`. Lifted to a new `src/types/pr.ts` export so future additions only touch one place.
- **Tabtab completion**: The `env.prev` dispatch in `cli.ts` was an eight-branch if/else chain hand-maintained next to Commander's command tree. Replaced with a single `ReadonlyMap<parent, subcommands>` table, keeping the special-case `comments` disambiguation (its parent can be `pr` or `snippet`) separate. Same completions, fewer branches to keep in sync.
