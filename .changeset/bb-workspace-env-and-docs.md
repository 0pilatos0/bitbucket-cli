---
'@pilatos/bitbucket-cli': minor
---

Add `BB_WORKSPACE` environment variable support and tighten the public docs.

- `BB_WORKSPACE` now feeds into workspace resolution as a fallback between
  git context and `config.defaultWorkspace`. The full precedence is:
  `--workspace` flag → git remote → `BB_WORKSPACE` → `config.defaultWorkspace`.
  Previously, the variable was advertised in `.env.example` but read nowhere.
- New `reference/global-flags` docs page consolidates every flag that works
  on every command (`--json`, `--jq`, `--no-color`, `--no-unicode`,
  `--no-truncate`, `--limit`, `--all`, `--locale`, `-w`, `-r`).
- Reference and README env-var tables now list `BB_WORKSPACE`, `BB_LOCALE`,
  and `BB_NO_UNICODE` (previously undocumented). `DEBUG` is clarified as
  requiring the literal string `true`.
- Changelog page adds entries for 1.15.0 through 1.18.0 (locale, Unicode
  toggle, spinner, global `--no-truncate`, `--all`, pagination hints).
- `CONTRIBUTING.md` trimmed to onboarding-only; deep conventions live in
  `AGENTS.md`.
- App-password deprecation notices no longer hard-code Atlassian's
  deprecation dates — they link to Atlassian's own page instead.
