---
'@pilatos/bitbucket-cli': minor
---

List commands now indicate when output was capped by `--limit` and add an `--all` flag to fetch every page. When more results exist than were shown, `repo list`, `pr list`, `pr activity`, `pr comments list`, `snippet list`, and `snippet comments list` print a dimmed footer such as `Showing 25 repositories. Use --limit <n> or --all to see more.` (suppressed in `--json` mode). Pass `--all` to retrieve all results regardless of `--limit`.
