---
'@pilatos/bitbucket-cli': patch
---

Refresh the Bitbucket Cloud API client from the latest upstream spec and add spec update automation

- Regenerate `src/generated/` against the current Bitbucket Cloud OpenAPI spec (removes the deprecated `addon/linkers` endpoints, adds `file-conflicts`/PR `conflicts` endpoints)
- Normalize upstream spec warts before generation (`scripts/normalize-spec.ts`) so content/inline models and `PipelineSelector.type` stay typed
- Add `check:api-updates` / `update:api` scripts plus a weekly CI check that opens an issue when the spec drifts
