---
'@pilatos/bitbucket-cli': patch
---

Test infrastructure cleanup (#149):

- Centralize the OAuth-capable mock config service in `tests/setup.ts`; `tests/services/api-client.test.ts` now reuses `createMockConfigService` instead of rolling its own duplicate factories.
- Track temp dirs created by `tests/services/snippet-files.service.test.ts` and remove them in `afterEach` so `bb-snippet-*` dirs no longer accumulate under `$TMPDIR` across test runs.
