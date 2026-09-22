---
'@pilatos/bitbucket-cli': minor
---

Prompt for missing input in an interactive terminal. Destructive commands (`repo delete`, `repo default-reviewers remove`, `pr comments delete`, `snippet delete`, `snippet comments delete`) ask `Continue? (y/N)` instead of failing without `--yes`, `pr create` asks for a missing title and optional description, and `auth login` asks for the auth method and a missing username or token. Prompts only appear when stdin and stdout are both TTYs; pipes, CI, `--json`, the new global `--no-input` flag and `BB_PROMPT_DISABLED` keep the existing non-interactive behavior. Declining or interrupting a prompt exits with the new error code 5004 `PROMPT_CANCELLED`.
