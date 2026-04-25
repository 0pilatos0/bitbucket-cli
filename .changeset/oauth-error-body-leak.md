---
'@pilatos/bitbucket-cli': patch
---

security: stop persisting the OAuth token-endpoint response body in `BBError.context`. The raw body could include attacker-influenced data when a custom OAuth provider was configured via `--client-id`/`--client-secret`, and surfaced through `--json` error output. The error now exposes only `{ status }` in `context`; if the response is a JSON body with `error_description`, a sanitized, length-capped excerpt is folded into the user-facing `message`.
