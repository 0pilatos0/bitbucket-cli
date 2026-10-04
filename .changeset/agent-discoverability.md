---
'@pilatos/bitbucket-cli': minor
---

Make `bb` easier for scripts and AI agents to discover. `bb help --json` (and `bb help <command> --json`) prints the command tree with arguments, flags, choices, defaults and examples. `bb context` shows the workspace, repository, remote and branch `bb` would use, and where each came from, without a network call. `bb agent-instructions` prints the agent instructions that ship with the installed version, the same text the AI agents guide shows. A user alias named `context` or `agent-instructions` is now shadowed by the new command.
