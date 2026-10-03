---
'@pilatos/bitbucket-cli': minor
---

`bb repo clone` takes `--protocol ssh|https` and a `gitProtocol` config key, so you can clone without SSH keys. Clone and fetch now show git's progress (on stderr) and are no longer killed after 60 seconds. `bb pr checkout` fetches from whichever remote points at the repository, checks out fork pull requests as `pr-<id>`, fast-forwards an existing local branch instead of leaving it stale, and reports git errors such as a dirty working tree instead of hiding them.
