---
'@pilatos/bitbucket-cli': minor
---

Add gh-style pull request workflow commands. `bb pr list` gains `--author`, `--reviewer` (both accept `@me`), `--source`, `--destination` and a raw `--query`, all filtered server-side; `--mine` stays as shorthand for `--reviewer @me`. New `bb pr status` shows the PR for the current branch, your open PRs and PRs awaiting your review. New `bb pr unapprove` and `bb pr request-changes [--undo]` complete the review actions.
