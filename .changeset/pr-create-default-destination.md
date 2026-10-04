---
'@pilatos/bitbucket-cli': patch
---

`bb pr create` without `--destination` now targets the repository's main branch (for example `master` or `develop`) instead of always `main`. The text output shows the destination branch.
