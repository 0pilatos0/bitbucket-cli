---
'@pilatos/bitbucket-cli': minor
---

feat: add `--json <fields>` projection and `--jq <expression>` filter to JSON output

Match the `gh` CLI's JSON formatting flags so muscle memory and scripts port over cleanly:

- `--json [fields]` accepts an optional comma-separated field list (e.g. `--json number,title,author.display_name`). Bare `--json` keeps the existing full-object output for backwards compatibility.
- `--jq <expression>` runs the JSON output through a [`jq-wasm`](https://www.npmjs.com/package/jq-wasm) embedded jq engine. Requires `--json`.
- Field projection drops the wrapper around list-style results (e.g. `pullRequests`, `repositories`, `snippets`) and projects per-item, matching `gh` semantics.
- Dotted paths (`author.display_name`) traverse nested objects.
- Invalid jq expressions exit non-zero with the underlying jq error.

Examples:

```bash
bb pr list --json number,title,state
bb pr list --json author --jq '.[].author.display_name'
bb pr list --json number,title,state --jq '.[] | select(.state == "OPEN") | .title'
```
