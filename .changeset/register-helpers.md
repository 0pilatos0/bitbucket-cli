---
'@pilatos/bitbucket-cli': patch
---

refactor(bootstrap): collapse DI registrations behind `registerApiClient` and `registerCommand` helpers

Internal cleanup — no behavior change. `bootstrap.ts` shrinks from ~874 to ~591 lines by extracting two local helpers:

- `registerApiClient(container, token, ctor)` for generated OpenAPI clients (ConfigService + OAuthService + axios wiring).
- `registerCommand(container, token, ctor, deps)` for the ~40 commands (and simple services) whose factory is just `resolve → resolve → new Cmd(...)`.

Adding a new command is now a 3–8 line registration instead of a ~10 line boilerplate block. Resolves #147.
