---
'@pilatos/bitbucket-cli': minor
---

Add `bb doctor`, which checks the Bun runtime, config file, network access, authentication, token scopes and git remote detection, prints a pass/warn/fail row for each (`--json` supported), and exits 1 when a check fails.

`bb auth status` now exits 1 when you are not logged in, matching `gh auth status` and its existing exit 1 for invalid credentials. Its output is unchanged. Scripts that ran it only to print status should append `|| true`.
