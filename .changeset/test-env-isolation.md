---
'@pilatos/bitbucket-cli': patch
---

Test runs are now isolated from real `BB_*` environment variables via a bun test preload, so a developer's working `bb` setup no longer breaks the test suite (#294). No functional changes to the CLI itself.
