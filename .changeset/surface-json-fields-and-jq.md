---
'@pilatos/bitbucket-cli': patch
---

docs: surface `--json <fields>` projection and `--jq` filter throughout README, quickstart, per-command pages, and CLI help

Adds the `--jq` flag to the README global options, a scripting callout in the
quickstart, and `--json fields` / `--jq` examples to the highest-traffic command
pages (`pr list`, `pr view`, `pr create`, `repo list`, `snippet list`). The
`--jq` description in `bb --help` now includes an inline example, and the
`reference/json-output.mdx` page gains a before/after shape comparison and three
additional combined projection + jq patterns.

No CLI behavior changes — `--json [fields]` and `--jq <expression>` already
existed; this PR is purely about discoverability.
