---
'@pilatos/bitbucket-cli': patch
---

Fix `bb pr comments edit` failing with `Bad request`. The update payload sent a `type` key, which the Bitbucket comment endpoint rejects with `extra keys not allowed`; the body now carries content only. `bb pr comments reply` had the same problem on both `type` and `parent.type` and is fixed too.

API errors now include Bitbucket's `error.fields` detail, so a rejected payload reports `Bad request (type: extra keys not allowed)` instead of a bare `Bad request`.
