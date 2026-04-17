---
'@pilatos/bitbucket-cli': patch
---

Redact `access_token`, `refresh_token`, and other token-bearing fields from `DEBUG=true` HTTP response logs so OAuth secrets no longer leak into terminal output or CI logs when debugging.
