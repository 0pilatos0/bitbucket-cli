---
"@pilatos/bitbucket-cli": patch
---

Fix silent error swallowing in runCommand: ensure process.exitCode is always set on failure and log container resolution errors
