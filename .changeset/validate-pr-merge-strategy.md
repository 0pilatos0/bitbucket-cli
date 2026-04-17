---
'@pilatos/bitbucket-cli': patch
---

Validate `bb pr merge --strategy` locally against the allowed merge strategies (`merge_commit`, `squash`, `fast_forward`, `squash_fast_forward`, `rebase_fast_forward`, `rebase_merge`). Invalid values now fail fast with a helpful `--strategy must be one of: …` message instead of surfacing as an opaque Bitbucket API error.
