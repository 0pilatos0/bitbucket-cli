---
'@pilatos/bitbucket-cli': patch
---

Fix `--jq` failing in the published package

- The jq-wasm WebAssembly binary was never shipped next to the bundled CLI, so `--jq` crashed at runtime from an installed package (`dist/build/jq.wasm` missing)
- `bun run build` now stages the wasm via `scripts/build.ts` and ships it in `dist/`
- Added `BB_API_BASE_URL` to point the API client at a gateway/mirror/mock (used by the new end-to-end dist smoke test, which runs `--jq` through the real built binary)
