---
'@pilatos/bitbucket-cli': minor
---

`bb pr comments list` now shows a `Status` column (`resolved`, `pending`, or `open`) and supports `--resolved` / `--unresolved` flags to filter comments by resolution state, closing the remaining part of #292. The active filter is echoed under `filters.resolution` in `--json` output.
