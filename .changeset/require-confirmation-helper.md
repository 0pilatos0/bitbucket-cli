---
'@pilatos/bitbucket-cli': patch
---

Standardize the `--yes` confirmation pattern across destructive commands.
The duplicated check and `BBError` throw is extracted into
`BaseCommand.requireConfirmation()`, and the trailing instruction is now a
consistent `Use --yes to confirm.` (previously a mix of
`Use --yes to confirm.` and `Use --yes to confirm deletion.`).

Affected commands:

- `repo delete`
- `repo default-reviewers remove`
- `pr comments delete`
- `snippet delete`
- `snippet comments delete`

The warning text describing the action being gated is unchanged.
