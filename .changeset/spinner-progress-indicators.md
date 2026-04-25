---
'@pilatos/bitbucket-cli': minor
---

Add a spinner progress indicator for long-running operations.

`IOutputService` now exposes a `spinner(text)` factory returning an
`ISpinner` handle (`start` / `stop` / `succeed` / `fail` / `setText`). The
spinner auto-disables in JSON mode (would corrupt machine-readable output),
non-TTY streams (pipes, redirects, CI), and tests — every method is a safe
no-op there, so callers can instrument commands without branching on the
runtime environment.

`OutputService` tracks the active spinner and stops it before any other
write (`success`, `error`, `warning`, `info`, `text`, `table`, `json`,
`jsonError`), so a forgotten spinner can never interleave with regular
output. Two concurrent spinners cannot fight over the same line either —
creating a new spinner stops the previous one.

Instrumented the high-priority long-running commands listed in the
proposal:

- `bb pr create` — "Creating pull request..."
- `bb pr merge` — "Merging pull request #{id}..."
- `bb repo clone` — "Cloning {repo}..."

Implementation is dependency-free (no `ora`); the `Spinner` class lives in
`src/services/spinner.ts` and renders 10-frame braille animation with
ANSI cursor hide/show and line-clear sequences. Cursor restore is wired
to `SIGINT`, `SIGTERM`, and `exit` so an interrupted CLI doesn't leave
the cursor hidden.
