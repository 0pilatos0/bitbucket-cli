---
'@pilatos/bitbucket-cli': patch
---

Shrink the published bundle

- `bun run build` now minifies the bundle: `dist/index.js` goes from 1.79 MB to 0.91 MB (−49%). Sourcemaps are kept (5.8 MB) so uncaught stack traces still resolve to original source; drop `--sourcemap` in `scripts/build.ts` if the tarball size matters more than trace readability
- `jq-wasm` moved to devDependencies: its runtime is fully bundled into `dist/index.js` and only the staged wasm asset is read at runtime, so published installs no longer download ~1.4 MB of jq-wasm package files
