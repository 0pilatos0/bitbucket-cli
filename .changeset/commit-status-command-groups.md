---
'@pilatos/bitbucket-cli': minor
---

Add `bb commit` and `bb status` command groups. `bb commit list` lists commit history (defaulting to the current git branch, with `--ref <branch|tag|sha>` to pick any revision) and `bb commit view <sha>` shows full commit details including author, date, parents, and message. `bb status list <sha>` lists the build statuses reported on a commit, and `bb status set <sha> --key <key> --state <state>` creates or updates a build status — idempotently per key, so CI re-runs can safely re-report INPROGRESS/SUCCESSFUL/FAILED states. All commands support the standard repo-scoped context resolution, `--json`/`--jq` envelopes, and shell completion for `--state` values.
