---
'@pilatos/bitbucket-cli': patch
---

Polish help and argument parsing. Subcommand help now lists the global flags (`-w`, `-r`, `--json`, `--jq`, `--no-input`, ...) under "Global Options". Enum option values ignore case, so `bb pr list -s open` works. Parse errors from the argument parser use the same `✗` prefix as every other error, alias errors no longer print a doubled `Error:`, and a bad positional ID names the argument (`<id> must be a positive integer`) instead of a `--id` flag that doesn't exist. Running a command group without a subcommand (`bb status`) prints its help and exits 0, and a mistyped subcommand (`bb pr lsit --json`) returns a JSON error envelope under `--json`.
