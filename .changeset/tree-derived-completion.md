---
'@pilatos/bitbucket-cli': patch
---

Derive shell completion from the live command tree instead of hand-maintained tables, so completion stays correct automatically as commands and flags change. This also adds flag-value completion for enum options: `bb pr merge --strategy <Tab>` suggests the valid merge strategies, `bb pr list --state <Tab>` the PR states, `bb snippet list --role <Tab>` the roles, `bb pr diff --color <Tab>` the color modes, and `bb api -X <Tab>` the HTTP methods. In zsh and fish each suggestion now carries its description.

The change is purely additive: option validation and error output are unchanged — invalid values still raise the usual error (and honor `--json`), and `bb api -X get` stays case-insensitive.
