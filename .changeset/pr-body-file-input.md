---
'@pilatos/bitbucket-cli': minor
---

Add `-F/--body-file <file>` to `bb pr create`, `bb pr comments add` and `bb pr comments reply`, and let `bb pr edit --body-file` read stdin. Pass a file path, or `-` to read stdin, so multi-line markdown with backticks, quotes or `$` reaches Bitbucket as written without shell escaping. On the comment commands the `<message>` argument becomes optional when `--body-file` is given. Passing both inline text and `--body-file` is rejected on the new flags; `bb pr edit` keeps letting the file override `--body`.
