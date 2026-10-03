---
'@pilatos/bitbucket-cli': minor
---

Make failures machine-readable for scripts and agents.

- Argument-parsing errors (unknown option or subcommand, missing or extra arguments, a command group run without a subcommand) now come back as a JSON envelope on stderr whenever `--json` or `--jq` is on the command line, with `context.parseError`, `context.commandPath` and a `hint`. `--jq` without `--json` also reports its error as JSON.
- A destructive command run without `--yes` where it can't ask now fails with the new code `5005 CONFIRMATION_REQUIRED` (previously `5001`), and `context.retry` holds the exact command to rerun with `--yes`.
- Paginated list envelopes now include `hasMore` and `limit` (`null` under `--all`), so you can tell when `--limit` cut the results short.
- Opt-in `BB_DETAILED_EXIT_CODES=1` exits `2` for usage errors, `3` for not found, `4` for authentication and `5` for confirmation required. Without it every failure still exits `1`.
