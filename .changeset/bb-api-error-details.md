---
'@pilatos/bitbucket-cli': minor
---

`bb api` now surfaces the full upstream error exchange (issue #323):

- On a non-2xx response the error body is printed to **stderr after** the `✗`
  line (previously stdout, before it), so stdout stays parseable.
- `-i/--include` is honored on failures, printing the status line and response
  headers before the body.
- `--json` error output for `bb api` now includes the upstream `headers` and
  `statusText` alongside `statusCode` and `response`.
- Plain-text upstream bodies (e.g. `Bad Request` from the request parser) now
  become the error `message` instead of axios's generic
  "Request failed with status code 400". This applies to every command.
- `bb api` error bodies are no longer field-projected or `--jq`-filtered; they
  go to stderr verbatim.
