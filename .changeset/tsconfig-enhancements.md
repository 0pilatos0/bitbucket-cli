---
'@pilatos/bitbucket-cli': patch
---

chore(tsconfig): tighten type-checking for TypeScript 6

- Enable `verbatimModuleSyntax`, `isolatedModules`, and `noUncheckedIndexedAccess` for stricter, Bun-aligned type-checking.
- Replace legacy `bun-types` entry with `bun` (matches the `@types/bun` dependency).
- Drop `declaration`, `outDir`, and `rootDir` — no-ops under `noEmit: true`, since builds go through `bun build`.

No runtime behavior change. A handful of internal `string | undefined` sites from regex captures and guaranteed-index array access were narrowed with non-null assertions.
