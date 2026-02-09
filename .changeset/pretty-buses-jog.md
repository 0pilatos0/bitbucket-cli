---
'@pilatos/bitbucket-cli': patch
---

Fix Windows config path resolution to store `config.json` in `%APPDATA%\bb` by default, with a home-directory fallback when `APPDATA` is unavailable. This aligns runtime behavior with the documentation.
