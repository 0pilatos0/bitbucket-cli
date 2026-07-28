---
'@pilatos/bitbucket-cli': patch
---

Fix `bb pr comments resolve` failing with `Bad request` on every comment. The resolve endpoint declares no request payload, so the generated client sent no body at all, and Bitbucket rejects the POST without one. The command now sends an empty JSON body. `bb pr comments unresolve` was never affected — Bitbucket accepts that DELETE with no body.
