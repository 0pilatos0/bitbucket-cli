---
'@pilatos/bitbucket-cli': patch
---

fix(pagination): reject `--limit 0` and other non-positive values instead of silently returning no results

`parseLimit` previously fell back to the default limit when given `0`, a negative number, or a non-numeric string — except for `collectPages`, which honored `0` by returning an empty array. A user passing `--limit 0` got zero results with no feedback. `parseLimit` now throws a `VALIDATION_INVALID` `BBError` (`--limit must be a positive integer`) for any explicit non-positive or non-finite value. A missing option still returns the fallback. Adds a dedicated `tests/services/pagination.test.ts` covering `parseLimit` and `collectPages`. Resolves #145.
