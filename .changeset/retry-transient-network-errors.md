---
'@pilatos/bitbucket-cli': patch
---

Transient network failures (dropped sockets, temporary DNS hiccups, request timeouts) on read requests now retry up to 3 times with exponential backoff instead of failing immediately. Only idempotent methods (GET/HEAD/OPTIONS) are retried; write requests still fail fast since the CLI cannot know whether the server already processed them. Permanent-looking failures such as unknown host or connection refused are not retried.
