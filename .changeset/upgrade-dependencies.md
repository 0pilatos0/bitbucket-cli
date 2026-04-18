---
'@pilatos/bitbucket-cli': patch
---

chore(deps): upgrade dependencies

- `axios` 1.13.2 → 1.15.0
- `commander` 14.0.2 → 14.0.3
- `@changesets/cli` 2.29.8 → 2.31.0
- `@changesets/changelog-github` 0.5.2 → 0.6.0
- `@openapitools/openapi-generator-cli` 2.28.0 → 2.31.1
- `@types/bun` 1.3.5 → 1.3.12
- `@types/node` 25.1.0 → 25.6.0
- `prettier` 3.8.1 → 3.8.3
- `typescript` 5.9.3 → 6.0.3

TypeScript 6 migration verified: project already uses `moduleResolution: bundler`, strict mode, and ESM — none of the removed legacy flags or the dropped `node` resolution are in use. `tsc --noEmit`, full test suite (788 tests), and `bun build` all pass.
