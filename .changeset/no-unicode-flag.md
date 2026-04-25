---
'@pilatos/bitbucket-cli': minor
---

Add `--no-unicode` flag and `BB_NO_UNICODE` env var to substitute ASCII fallbacks for Unicode glyphs (separators, arrows, status icons, info/warning/error/success symbols) in non-JSON output. Useful for older terminals, constrained CI environments, or fonts that render the original glyphs as boxes. Mirrors the `gh` CLI's `GH_NO_UNICODE`.
