---
"@pilatos/bitbucket-cli": minor
---

Add snippet command group with full CRUD support for Bitbucket snippets

New commands:
- `bb snippet list` — list workspace snippets with role filtering
- `bb snippet view <id>` — view snippet details including files
- `bb snippet create` — create snippets with file attachments
- `bb snippet edit <id>` — update snippet title and visibility
- `bb snippet delete <id>` — delete snippets with confirmation
- `bb snippet watch/unwatch <id>` — manage snippet watching
- `bb snippet comments list/add/edit/delete` — full comments CRUD

All commands support `--json` output and workspace resolution via `--workspace` flag or `defaultWorkspace` config.
