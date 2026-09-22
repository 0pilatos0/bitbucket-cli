---
'@pilatos/bitbucket-cli': minor
---

Add leveled HTTP debug tracing via `BB_DEBUG`. `BB_DEBUG=http` logs method, URL, status (or network error code) and elapsed time per request; `BB_DEBUG=verbose` also logs the redacted response bodies. Every trace line carries a short correlation id that stays the same across retries and OAuth token refreshes, so overlapping requests can be told apart. `DEBUG=true` keeps working as an alias for `BB_DEBUG=verbose`, and the network error messages now point at `BB_DEBUG=http`.
