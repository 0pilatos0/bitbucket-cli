---
'bitbucket-cli': patch
---

Centralize horizontal section dividers behind a new `output.separator()` helper so all framed command output (e.g. `pr view`, `pr checks`, `snippet view`, the version-update banner) uses a consistent gray Unicode rule. The version-update banner now renders through `output.warning()` so it picks up proper warning styling instead of an inline `⚠` glyph.
