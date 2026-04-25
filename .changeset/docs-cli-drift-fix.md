---
'@pilatos/bitbucket-cli': patch
---

Reconcile drift between CLI help, docs, and code (issue #181).

- `bb auth login --app-password`: clarify that app passwords are deprecated and the flag opts into API token auth.
- `bb pr list --mine`: tighten help text to say "PRs where you are a reviewer (not authored by you)" so the meaning isn't ambiguous.
- `bb pr reviewers add` / `remove`: rename the positional from `<username>` to `<user>`, document that it accepts an account ID or `{uuid}`, and update examples (Bitbucket Cloud no longer accepts the legacy login name).
- `bb snippet create --file` / `bb snippet edit --file`: note in help that the flag is variadic and can be repeated.
- Docs: add the auto-managed `lastVersionCheck` config key to the configuration reference and include `default-reviewers` in the `bb repo <Tab>` completion example.
