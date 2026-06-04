---
'@pilatos/bitbucket-cli': minor
---

Add `bb api`, a raw authenticated passthrough to the Bitbucket Cloud 2.0 API
(mirrors `gh api`). It is the escape hatch for endpoints not yet wrapped by a
typed command, reusing the shared authenticated stack (Basic/Bearer auth,
OAuth refresh, retry, redaction).

- `bb api [method] <endpoint>` — method may be a leading positional verb
  (`bb api GET /user`) or a path only (`bb api /user`); `-X/--method`
  overrides. Defaults to `GET`, or `POST` when fields/body are present.
- `-f/--raw-field` (string) and `-F/--field` (typed: `true`/`false`/`null`,
  numbers, `@file`, `@-` for stdin). On `GET`/`HEAD` fields become query
  params; otherwise a JSON body.
- `--input <file>` reads a raw request body (`-` for stdin); mutually
  exclusive with `-f`/`-F`.
- `-H/--header` adds request headers; `Authorization` stays managed.
- `--paginate` follows the cursor (`next`) and merges every page's `values`.
- `{workspace}` and `{repo}` placeholders are filled from `--workspace`/
  `--repo` or the current repository.
- Global `--json [fields]` and `--jq` apply to the response; non-JSON bodies
  (e.g. raw diffs) print verbatim. API error responses are surfaced, and
  `APIError` JSON now carries `statusCode` and the response body.
- Absolute URLs are restricted to `api.bitbucket.org` so credentials are
  never sent to a foreign host.
