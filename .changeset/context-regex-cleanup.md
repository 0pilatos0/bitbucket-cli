---
'@pilatos/bitbucket-cli': patch
---

refactor(context): drop pointless `new RegExp(/literal/)` wrapping in remote URL parser

Internal-only change — no behavior change. `ContextService.parseRemoteUrl` constructed its SSH and HTTPS regexes as `new RegExp(/.../).exec(url)`, which wraps an already-compiled regex literal in a second `RegExp` constructor call. Replaced with direct `/regex/.exec(url)` calls.
