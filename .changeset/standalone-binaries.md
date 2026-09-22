---
'@pilatos/bitbucket-cli': minor
---

Ship standalone `bb` executables for Linux (x64, arm64), macOS (x64, arm64)
and Windows (x64) with every GitHub Release, so `bb` runs without Bun, Node.js
or npm. Each release includes a `SHA256SUMS` file and build provenance
attestations (`gh attestation verify`). The npm package is unchanged.

`bb completion install` now embeds tabtab's shell templates instead of reading
them from disk, and reports a failure instead of claiming success when the
completion script cannot be written.

The update notice in a standalone binary links to the latest release instead of
suggesting `bun install -g`. tabtab is now bundled into the npm package, so it
is no longer installed as a runtime dependency.
