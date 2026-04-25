---
'@pilatos/bitbucket-cli': minor
---

Add a global `--no-truncate` flag that disables column truncation in table output across `bb pr list`, `bb pr activity`, `bb pr checks`, `bb pr edit`, `bb pr comments list`, `bb repo list`, and `bb snippet comments list`. The previously command-local `--no-truncate` flag on `bb pr comments list` is now subsumed by the global flag and no longer needs to be passed separately. JSON output is unaffected.
