---
'@pilatos/bitbucket-cli': patch
---

Resolve the `-w` short-flag collision in `bb pr diff` by making `--web`
long-form only, keeping `-w` consistently reserved for global
`--workspace`.
