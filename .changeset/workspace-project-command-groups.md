---
'@pilatos/bitbucket-cli': minor
---

Add the `bb workspace` and `bb project` command groups for discovery — no more guessing slugs and keys. `bb workspace list` shows every workspace you have access to (filterable with `--role owner|collaborator|member`) so you can pick a slug for `-w/--workspace` or `bb config set defaultWorkspace`, and `bb workspace view [slug]` shows workspace details (defaulting to the current workspace context). `bb project list` lists the projects in a workspace, `bb project view <key>` shows project details, and `bb project create --key <KEY> --name <name>` creates a project (private by default, `--public` to flip; keys are validated and uppercased automatically) ready for `bb repo create -p <KEY>`. All commands work non-interactively and emit stable, documented `--json` envelopes.
