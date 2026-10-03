---
'@pilatos/bitbucket-cli': patch
---

Require HTTPS on the Bitbucket API host for absolute `bb api` endpoints and
pagination links. Reject malformed URLs, protocol-relative paths, embedded URL
credentials, backslashes and raw control characters before sending a request.
Update audited transitive dependencies used by completion and API generation.
