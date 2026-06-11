---
'@pilatos/bitbucket-cli': minor
---

Add the `bb pipeline` command group for Bitbucket Pipelines (CI/CD): `bb pipeline list` (filter by `--status`/`--branch`, sortable, paginated), `bb pipeline view <id>` (details plus per-step summary), `bb pipeline run` (trigger on the current or a given branch, with `--commit`, custom `--pipeline` definitions, and repeatable `--var key=value` variables), `bb pipeline stop <id>`, and `bb pipeline logs <id>` (raw step logs with `--step` selection by UUID or index). Pipeline IDs are accepted as build numbers or UUIDs everywhere, and every command emits a stable, documented `--json` envelope.
