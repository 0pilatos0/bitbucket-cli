---
'@pilatos/bitbucket-cli': patch
---

Concurrent API calls no longer race the OAuth token refresh. Refreshes are now serialized behind an in-flight lock, so parallel requests that see an expired token (or all hit 401) share a single POST to the token endpoint instead of each sending the rotated refresh token and silently logging you out.
