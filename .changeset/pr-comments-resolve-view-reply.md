---
'@pilatos/bitbucket-cli': minor
---

Complete the `bb pr comments` surface with four new subcommands (issue #292): `bb pr comments view <pr-id> <comment-id>` shows one comment with its author, date, state (`[resolved]`/`[unresolved]`/`[pending]`) and raw content; `bb pr comments reply <pr-id> <comment-id> <message>` posts a threaded reply attached to the parent comment; `bb pr comments resolve <pr-id> <comment-id>` and `bb pr comments unresolve <pr-id> <comment-id>` close and reopen a comment thread. All four support `--json`. Note that the Bitbucket API returns only a resolution record for `resolve` and no body for `unresolve`, so their JSON payloads carry the identifiers (plus the resolution for `resolve`) rather than the full comment — use `bb pr comments view` to read the comment back.
