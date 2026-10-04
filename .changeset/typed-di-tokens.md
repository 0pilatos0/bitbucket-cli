---
'@pilatos/bitbucket-cli': patch
---

Type-check dependency injection wiring: service tokens now carry the type they resolve to, so a swapped or missing constructor dependency or a mistyped command option fails the build instead of surfacing at runtime. No change to CLI behavior.
