---
'@pilatos/bitbucket-cli': minor
---

Read repository files and manage download artifacts without cloning (part of #276):

- `bb repo cat <path> [--ref <ref>]` prints a file's contents. Output is written
  byte-for-byte when piped, so `bb repo cat logo.png > logo.png` and
  `bb repo cat package.json | jq` work; `--json` returns the content (UTF-8, or
  base64 for binary files) with the resolved commit.
- `bb repo ls [path] [--ref <ref>]` lists a directory (`--limit`/`--all`,
  `--json` envelope key `entries`).
- `bb repo downloads list|upload|delete` manages the repository's Downloads
  (`--json` envelope key `downloads`). Bitbucket only offers Downloads on paid
  workspace plans.

Both source commands default to the repository's main branch and accept
branch names containing `/` (such as `feature/x`).
