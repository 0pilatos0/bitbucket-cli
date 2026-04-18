---
'@pilatos/bitbucket-cli': patch
---

fix(snippet): replace `as unknown as` casts in snippet comment commands with real types

Internal-only change — no user-facing behavior change. The generated `SnippetComment` extends `ModelObject` which carries an `[key: string]: any` index signature, so the surrounding `as unknown as SnippetComment` / `as unknown as Record<string, unknown>` casts in `comments.add`, `comments.edit`, and `comments.list` were load-bearing only because nobody had tried the direct typing. Constructing the request bodies as `SnippetComment` directly and reading response fields without the intermediate record cast keeps the same runtime behaviour while narrowing the places TypeScript is told to look the other way.
