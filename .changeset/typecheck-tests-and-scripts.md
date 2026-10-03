---
'@pilatos/bitbucket-cli': patch
---

Type-check tests and build scripts in `bun run lint`, and fix the drift it surfaced. The internal DI container's `registerClass` now accepts classes with typed constructor parameters.
