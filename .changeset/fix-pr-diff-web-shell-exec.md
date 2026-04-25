---
'@pilatos/bitbucket-cli': patch
---

fix(security): use `open` package in `pr diff --web` instead of shell-string `exec`

Replaces the platform-specific shell command (`open "${url}"`, `start "" "${url}"`,
`xdg-open "${url}"`) in `pr diff --web` with the already-bundled `open` package, so the
URL is no longer interpreted by `/bin/sh` or `cmd.exe`. URLs containing shell
metacharacters (`&`, `` ` ``, `$`, `"`, `|`, `>`) are now passed verbatim to the
browser instead of being parsed as shell syntax.
