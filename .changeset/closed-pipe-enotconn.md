---
'@pilatos/bitbucket-cli': patch
---

Stop printing a crash report when a reader closes stdout early on macOS and the write fails with ENOTCONN instead of EPIPE (for example when another program spawns `bb repo cat` and stops reading).
