---
'@pilatos/bitbucket-cli': patch
---

refactor(services): drop duplicate types and unnecessary casts

Internal-only change — no user-facing behavior change. Three small cleanups in `src/services/`:

- `reviewer.service.ts` redefined its own `RepoContext` interface identical to the canonical one in `src/types/config.ts`. Removed the duplicate and imported the shared type.
- `extractReviewerUuids` and `buildReviewersUpdateBody` were re-exported from `src/services/index.ts` but only consumed inside `reviewer.service.ts` itself (and the colocated tests, which already import from the module directly). Narrowed the barrel to just `updatePullRequestReviewers`.
- `coerceVersionCheckIntervalValue(intervalDays as unknown)` in `version.service.ts` cast the argument to `unknown` unnecessarily — the coerce function accepts `unknown` already, and `IConfigService.getValue` returns a typed value.
