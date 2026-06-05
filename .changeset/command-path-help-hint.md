---
'@pilatos/bitbucket-cli': patch
---

Fix the `bb <command> --help` hint shown on validation errors to point at the exact command path. It previously sliced `process.argv` and guessed the first two tokens, which was wrong for top-level commands like `bb browse` and deeply nested ones like `bb pr comments add`. The hint now uses the resolved command path threaded through the command context.
