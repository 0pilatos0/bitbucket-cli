---
'@pilatos/bitbucket-cli': patch
---

Harden PR commands:

- `bb pr view`, `bb pr activity`, `bb pr merge`, and `bb pr checks` now validate `<id>` as an integer and fail fast with a clear `--id must be a valid integer` error instead of silently passing `NaN` to the Bitbucket API.
- `bb pr activity --type` now rejects unknown activity types (e.g. `--type commetn`) with a `--type must be one of: …` error instead of silently returning zero results.
- Removed the redundant local `--json` flag on `bb pr checks`; use the global `--json` option instead.
