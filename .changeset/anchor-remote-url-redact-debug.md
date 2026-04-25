---
'@pilatos/bitbucket-cli': patch
---

security: anchor `parseRemoteUrl` regex to reject crafted Bitbucket URLs like `git@bitbucket.org:foo/bar.git.attacker.com/x/y`, and redact query strings from request URL DEBUG logs.
