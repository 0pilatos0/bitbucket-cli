---
'@pilatos/bitbucket-cli': minor
---

Add locale-aware date formatting. Dates rendered by `bb` now follow the user's
locale instead of being hard-coded to `en-US`. The locale is resolved in this
order: `--locale <tag>` global flag, `BB_LOCALE` env var, the standard POSIX
chain (`LC_TIME` → `LC_ALL` → `LANG`), and finally `en-US` as a fallback. An
invalid tag silently falls back to `en-US` instead of throwing.
