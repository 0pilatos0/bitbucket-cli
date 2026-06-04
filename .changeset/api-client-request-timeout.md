---
'@pilatos/bitbucket-cli': minor
---

Add a configurable request timeout to the Bitbucket API client. Requests now time out after 30s by default so the CLI no longer hangs forever when a server accepts a connection but never responds — important for CI and scripts. Configure it via the `BB_HTTP_TIMEOUT` environment variable (milliseconds; set `BB_HTTP_TIMEOUT=0` to disable). Timed-out requests now surface a clear network error that points to `BB_HTTP_TIMEOUT`.
