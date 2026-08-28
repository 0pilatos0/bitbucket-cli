---
'@pilatos/bitbucket-cli': patch
---

fix: stop sending `Content-Type: application/json` with a zero-length body on bodyless requests (#321). Bodyless POSTs and DELETEs (`bb pr approve`, `bb pr decline`, `bb commit approve`, `bb api -X POST` without fields, etc.) inherited the shared client's `Content-Type: application/json` instance default, and Bitbucket's request parser rejected the empty body declared as JSON with a bare-text 400 before the request reached the endpoint. The header is now stripped at the adapter level whenever a request carries no body; requests with a body (JSON objects, raw `--input` strings, multipart snippet uploads) are unchanged.
