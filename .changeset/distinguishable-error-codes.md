---
'@pilatos/bitbucket-cli': minor
---

feat(errors): add distinguishable error codes for file-not-found and shell completion failures

Adds three new error codes so JSON-output-driven scripts can branch on the
specific failure mode instead of treating everything as `VALIDATION_INVALID`
(5002) or `UNKNOWN` (9999):

- `FILE_NOT_FOUND` (5003) — used by `bb snippet create/edit --file`,
  `bb snippet view --file`, and `bb pr edit --body-file` when a referenced
  file does not exist on disk or in the snippet
- `COMPLETION_INSTALL_FAILED` (9001) — `bb completion install` failures
- `COMPLETION_UNINSTALL_FAILED` (9002) — `bb completion uninstall` failures

`APIError` now also populates `context` with the failed request method,
URL and HTTP status, giving scripts structured fields to key on for 404s
and other API errors.

The error-code reference docs are updated with the new codes and clarify
the boundary between `AUTH_INVALID` (1002 — credentials rejected at
request time) and `AUTH_EXPIRED` (1003 — OAuth token expired *and* its
refresh failed).
