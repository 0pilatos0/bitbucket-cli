---
'@pilatos/bitbucket-cli': patch
---

`bb pr list --state` now applies when combined with `--mine`, `--reviewer`, `--author`, `--source`, `--destination` or `--query`; `bb pr status` and commands that find the PR for the current branch no longer pick up merged or declined pull requests.
