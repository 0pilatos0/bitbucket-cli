---
'@pilatos/bitbucket-cli': patch
---

ci: harden workflows and unblock Windows contributors

Pins Bun and every GitHub Action to explicit versions/SHAs, caches the Bun install directory, adds cancel-in-progress for PR runs, and drops the `grep "0 fail"` hack that could mask real test output. Release no longer tags or publishes until lint, format, and tests all pass, and stops swallowing GitHub Packages publish failures. CI now runs the full test + build on ubuntu, macos, and windows.

Surface fix while adding the matrix: `ConfigService.getConfigPath()` now uses `posix.join` on simulated non-Windows platforms so path resolution is correct when developers run the tests on Windows.
