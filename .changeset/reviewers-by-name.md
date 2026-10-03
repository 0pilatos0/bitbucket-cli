---
'@pilatos/bitbucket-cli': minor
---

`bb pr create --reviewer` and `bb pr reviewers add/remove` now accept a nickname, display name, email (workspace admins) or `@me` besides an account ID or `{uuid}`. Names are matched against the workspace members; an ambiguous name fails and lists the candidates' account IDs.
