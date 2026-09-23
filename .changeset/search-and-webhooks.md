---
'@pilatos/bitbucket-cli': minor
---

New `bb search code` and `bb webhook` command groups (part of #276). `bb search code <query...>` searches code across a workspace with Bitbucket's search syntax, `-r/--repo` narrows it to one repository, and a workspace without code search enabled gets a clear error instead of a bare 404. Atlassian has marked the code search endpoint deprecated from November 1, 2026. `bb webhook list|view|create|delete` manages repository webhooks, or workspace webhooks with `--scope workspace`; `create` takes `--url` and one or more `--event` values (validated and shell-completed), and `delete` requires `--yes`. All subcommands support `--json`.
