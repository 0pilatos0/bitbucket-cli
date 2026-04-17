---
'@pilatos/bitbucket-cli': patch
---

`bb pr comments delete` now requires `--yes` to confirm deletion, matching the guardrail on other destructive commands (`bb repo delete`, `bb snippet delete`, `bb snippet comments delete`).
