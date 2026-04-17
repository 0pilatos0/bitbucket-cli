---
'@pilatos/bitbucket-cli': minor
---

Add support for Bitbucket Default Reviewers (closes #139).

- New `bb repo default-reviewers list|add|remove` commands to inspect and manage the default reviewers of a repository. `list` shows the effective set (repo-level plus project-inherited) by default; pass `--direct` for only repo-level entries. `remove` requires `--yes` to confirm.
- `bb pr create` gains opt-in support for default reviewers:
  - `--default-reviewers` fetches and attaches the repository's effective default reviewers (matching the web UI behavior).
  - `--reviewer <username>` (repeatable) adds explicit reviewers independent of the defaults.
  - `--no-default-reviewers` skips defaults when the config key enables them.
  - The PR author is automatically excluded from the reviewer list.
- New config key `prCreateIncludeDefaultReviewers` (boolean, default `false`) makes `--default-reviewers` the default behavior on `bb pr create`.
