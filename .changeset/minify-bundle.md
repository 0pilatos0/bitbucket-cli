---
'@pilatos/bitbucket-cli': patch
---

Shrink the published bundle

- `bun run build` now minifies the bundle: `dist/index.js` goes from 1.79 MB to 0.91 MB (−49%). Sourcemaps are kept, so stack traces stay readable
- Measured with `bun build --metafile`; further reductions (stripping unused generated-client methods, replacing the axios transport with Bun's native fetch) are tracked separately
