---
'@pilatos/bitbucket-cli': patch
---

Emit structured JSON errors to stderr when `--json` is enabled, including typed error codes for command validation and config failures. This makes scripting more reliable while preserving non-zero exits and existing human-readable error output in non-JSON mode.
