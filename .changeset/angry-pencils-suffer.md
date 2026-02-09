---
'@pilatos/bitbucket-cli': patch
---

Fix `bb completion install` path errors in published builds by externalizing
`tabtab` during bundling so shell script templates are resolved from runtime
`node_modules` instead of CI-only absolute paths.
