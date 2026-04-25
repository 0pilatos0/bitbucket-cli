---
'@pilatos/bitbucket-cli': patch
---

Standardize empty-result messages on `output.info()` so all list/query
commands present a consistent blue `ℹ` icon when there is nothing to show.

Updated commands:

- `repo list` — `No repositories found`
- `pr list` — `No <state> pull requests found`
- `snippet list` — `No snippets found`
- `config list` — `No configuration set`
- `pr view` — `No reviewers assigned` (was a gray plain-text line)

The eight other commands that emit empty-result messages already use
`output.info()`; they are unchanged.
