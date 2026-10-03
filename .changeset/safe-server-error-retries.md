---
'@pilatos/bitbucket-cli': patch
---

Prevent mutation replay after HTTP 502, 503 and 504 responses by retrying only
GET, HEAD and OPTIONS. Keep the existing HTTP 429 retry policy for all methods.
