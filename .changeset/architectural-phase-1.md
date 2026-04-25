---
'@pilatos/bitbucket-cli': patch
---

Architectural Phase 1: leverage moves across services and commands.

- Add `OutputService.truncate()` and remove four duplicate command-local
  copies. Inline `slice + ellipsis` patterns in `pr comments list`,
  `snippet comments list` and `pr edit` now go through the shared helper.
- Add `BaseCommand.parsePositiveInt()` (strict: rejects "1abc", "1.5",
  zero, negatives) and migrate all `--id`, comment-id, line-to/line-from
  parsers to it. Removes the local `parsePositiveInt` in `bb browse`.
  Error messages now consistently end with a `Run \`bb … --help\` for
  usage.` hint.
- Add `IContextService.requireRepoContextFor(options, context)` to
  replace the boilerplate
  `requireRepoContext({ ...context.globalOptions, ...options })` that
  appeared in 23 commands.
- Add a 60-second default timeout to `GitService` so a stalled `git`
  subprocess no longer hangs the CLI; configurable via the constructor.
- Wrap `JSON.parse` in `ConfigService.getConfig()` so a corrupted config
  file surfaces a `BBError(CONFIG_READ_FAILED)` with a precise message
  instead of a generic `SyntaxError`.
- Wrap the dynamic `import('jq-wasm')` in `OutputService.runJq` so a
  missing/broken jq runtime surfaces a `BBError(JQ_FAILED)` with
  remediation guidance.
- Surface causes for opportunistic failures (`version-check` network
  errors, `oauth` browser-open failures) when `DEBUG=true`. Behavior is
  unchanged when DEBUG is unset.
- Make `pr comments list` and `pr reviewers list` JSON output include
  `workspace` and `repoSlug` for parity with the other list commands.
- Build now emits sourcemaps (`bun build --sourcemap`).
- CI now runs `bun run lint:docs` so error-code and env-var docs cannot
  drift unnoticed.
