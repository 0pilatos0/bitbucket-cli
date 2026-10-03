---
'@pilatos/bitbucket-cli': minor
---

Add gh-style pull request workflow commands. `bb pr list` gains `--author`, `--reviewer` (both take the same user forms as `bb pr create --reviewer`, including `@me`), `--source`, `--destination` and a raw `--query`, all filtered server-side; `--mine` stays as shorthand for `--reviewer @me`. New `bb pr status` shows the PR for the current branch, your open PRs and PRs awaiting your review. New `bb pr unapprove [id]` and `bb pr request-changes [id] [--undo]` complete the review actions (without an ID they use the open PR for the current branch).

`bb pr list --mine` now fails with an error if your account UUID can't be read from `GET /user`, instead of warning and listing every PR unfiltered.
