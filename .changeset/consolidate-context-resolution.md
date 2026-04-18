---
'@pilatos/bitbucket-cli': patch
---

refactor(context): consolidate workspace resolution onto `ContextService`

Internal cleanup — no behavior change. The standalone `resolveWorkspace()` helper is folded into `IContextService.requireWorkspace()`, so every command that needs workspace-or-repo context now depends on the same service. Snippet and workspace-only repo commands (`repo list` / `repo create` / `repo clone`) are migrated to inject `ContextService` instead of `ConfigService`, and `src/services/workspace-resolver.ts` is removed. Resolves #146.
