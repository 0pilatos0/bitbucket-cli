---
'@pilatos/bitbucket-cli': patch
---

Polish help and argument parsing. Subcommand help now lists the global flags (`-w`, `-r`, `--json`, `--jq`, `--no-input`, ...) under "Global Options". Enum option values ignore case, so `bb pr list -s open` works. Text-mode parse errors from the argument parser use the same `✗` prefix as every other error, alias errors no longer print a doubled `Error:`, and a bad positional ID names the argument (`<id> must be a positive integer`) instead of a `--id` flag that doesn't exist. Running a command group without a subcommand (`bb status`) prints its help and exits 0 (with `--json` it still reports a `missingSubcommand` error).
