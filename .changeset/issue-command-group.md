---
'@pilatos/bitbucket-cli': minor
---

Add the `bb issue` command group for Bitbucket's built-in issue tracker, mirroring `gh issue` ergonomics: `bb issue list` (with `--state`/`--kind`/`--assignee`/`--reporter` filters and a raw `--query` escape hatch), `bb issue view <id>`, `bb issue create` (`--title`, `--body`/`--body-file`, `--kind`, `--priority`, `--assignee`), `bb issue edit <id>`, `bb issue close <id>` (optionally posting a `--comment` first), and `bb issue comment <id>`. All commands emit stable `--json` envelopes, and 404s from a disabled issue tracker are reported with an actionable message pointing at Repository settings → Issue tracker (many teams use Jira instead).
