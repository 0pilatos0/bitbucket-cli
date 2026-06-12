---
'@pilatos/bitbucket-cli': patch
---

All API surfaces (generated Bitbucket clients, snippet file transfers, and the `bb api` passthrough) now share a single configured HTTP client, so retry/backoff, OAuth token refresh, and timeout behavior are uniform across every command.
