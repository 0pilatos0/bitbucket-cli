---
'@pilatos/bitbucket-cli': patch
---

test: add an integration test layer driving real commands through the real generated API client against a local mock Bitbucket HTTP server (#264). The fixture (`tests/helpers/mock-bitbucket.ts`) speaks enough of the wire protocol — paginated envelopes with `size`/`next`, Basic-auth enforcement, Bitbucket-shaped error bodies — to validate endpoint paths, query params, auth headers, pagination walking (including concurrent `--all` fetching), 429 retry behavior, and error mapping end-to-end.
