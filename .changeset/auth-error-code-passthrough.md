---
'@pilatos/bitbucket-cli': patch
---

Report auth and config failures with their real error code instead of `9999` (UNKNOWN). A missing login now fails with `1001`, insecure config permissions with `4001`, and an OAuth token refresh that Bitbucket rejects with `1003` plus Bitbucket's reason.
