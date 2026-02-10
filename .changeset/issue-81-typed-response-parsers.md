---
'@pilatos/bitbucket-cli': patch
---

Refine API response parsing by adding shared typed helpers for links,
diffstats, and pull request activity payloads. This removes command-level
`any` casts in PR/repo commands and adds focused tests for the new parsers.
