---
'@pilatos/bitbucket-cli': minor
---

Add "did you mean" suggestions for typos and actionable next steps on auth/permission/not-found failures.

**Suggestions.** A close-but-wrong command name or option value now gets a correction:

- Unknown top-level commands (`bb prr` → `(Did you mean pr?)`). Unknown *sub*commands and options already suggested; the root did not, reporting `too many arguments` instead.
- Every `must be one of` enum value (`--state`, `--kind`, `--priority`, `--sort`, `--role`, `--strategy`, ...), plus `bb api -X/--method`, `bb config get/set <key>`, and `bb pr activity --type` (which suggests per bad token in a comma list).
- Matching folds case, so `--state opne` suggests `OPEN` even though the allowed values are uppercase. Enum values are still *accepted* case-sensitively, and a value that is right apart from its case gets its own message — `(Values are case-sensitive — use OPEN.)` — rather than the user's own word echoed back.

**Remediation hints.** `401`, `403`, and `404` failures append one actionable line: `401` points at `bb auth login`, `403` explains that scopes cannot be added to an existing token and links the token-scopes reference, `404` covers both a wrong id/slug and a wrong `--workspace`/`--repo`. The `404` hint is suppressed where the message already names the missing resource and for `bb api`, where the user supplied the URL. In `--json` mode the text arrives as a new optional top-level `hint` field, present only when there is advice to give — existing envelopes are unchanged.

**Also fixed:**

- `bb help <command>` now works (`bb help pr`, `bb help pr comments`). It previously failed with `too many arguments`, while `bb pr help` worked.
- `bb --json pr list` now explains that `--json` swallowed `pr` as its field list and shows the correct flag position, instead of reporting a nonsensical unknown command.
- **Behavior change:** `bb pr diff --color <when>` now validates its value. It was advertised and typed but never checked, so a typo such as `--color alwyas` silently disabled color and exited 0; it now fails with the valid values and a suggestion.

Known limitation: `bb --json <typo>` with no following token still prints root help and exits 0 — it cannot be distinguished from a genuine field list. Argument-parsing errors from unknown *sub*commands and options remain plain text even under `--json`.
