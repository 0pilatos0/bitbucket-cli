---
'@pilatos/bitbucket-cli': minor
---

Add `install.sh` and `install.ps1` install scripts that pick the right standalone binary for your platform and verify it against `SHA256SUMS`. Releases now also ship compressed archives (`.tar.gz`, `.zip` on Windows) next to the raw binaries, plus a generated Homebrew formula and Scoop manifest.
