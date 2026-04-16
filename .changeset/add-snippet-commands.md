---
"@pilatos/bitbucket-cli": minor
---

Add snippet command group with full CRUD support for Bitbucket snippets.

New commands:

- `bb snippet list` — list workspace snippets, optional `--role` filter (`owner`, `contributor`, `member`)
- `bb snippet view <id>` — view snippet details; `--file <name>` prints one file, `--files` prints all
- `bb snippet create` — create snippets via `multipart/form-data`, uploading one or more `--file` arguments as the snippet body
- `bb snippet edit <id>` — update title/visibility (JSON PUT) or replace/add files (multipart PUT) via `--file`
- `bb snippet delete <id>` — delete snippets (requires `--yes`)
- `bb snippet watch <id>` / `bb snippet unwatch <id>` — manage snippet watching
- `bb snippet comments list | add | edit | delete` — full comments CRUD

All commands support `--json` output and workspace resolution via `--workspace` or the `defaultWorkspace` config key.

Internal refactor: a shared `resolveWorkspace()` helper now backs every
workspace-scoped command (snippet + `repo list` / `repo create` / `repo clone`), removing several copies of the same fallback logic.
