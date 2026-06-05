---
'@pilatos/bitbucket-cli': patch
---

Run the update-available check after every command instead of only when `bb` is invoked with no subcommand, so users who always run real subcommands see update notices. The notice now prints to stderr and only when stderr is an interactive TTY, output is not `--json`, and not in CI; it continues to honor `skipVersionCheck` and `versionCheckInterval`. This keeps `--json` and piped stdout byte-clean.
