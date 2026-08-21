---
'@pilatos/bitbucket-cli': minor
---

New `bb alias` command group for user-defined command aliases, mirroring `gh alias` (#275). `bb alias set <name> <expansion>` persists an alias in `config.json`; the alias then expands in place of the first argument (`bb co 42` → `bb pr checkout 42`). Expansions support `$1`–`$9` argument placeholders, and a `!` prefix runs the expansion through `sh -c` with the remaining arguments as shell positional parameters. `bb alias list` and `bb alias delete <name>` complete the surface; all three support `--json`. Aliases can never shadow built-in commands.
