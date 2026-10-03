---
'@pilatos/bitbucket-cli': minor
---

`bb pr view`, `activity`, `checks`, `merge`, `approve`, `decline`, `ready` and `comments list` no longer need a PR ID: leave it out to act on the open pull request for your current git branch, as `bb pr diff` and `bb pr edit` already did. The lookup now filters on the server in one request instead of paging through every open PR, ignores pull requests opened from other repositories (forks) with the same branch name, and stops with an error when several pull requests still match instead of picking one.
