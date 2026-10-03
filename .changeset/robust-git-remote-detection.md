---
'@pilatos/bitbucket-cli': patch
---

Detect the repository from more git remote shapes: dotted repository names, `ssh://` URLs, trailing slashes, SSH host aliases from `~/.ssh/config`, and Bitbucket remotes not named `origin`. When several remotes point to different Bitbucket repositories, the CLI now prefers `upstream` and otherwise asks for `--workspace`/`--repo`. Passwords embedded in a reported remote URL are masked.
