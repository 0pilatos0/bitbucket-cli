---
'@pilatos/bitbucket-cli': patch
---

security: harden config-file integrity

- Write the config via a unique tmp file with `O_EXCL` (`flag: 'wx'`) and an
  atomic `rename`, so a hostile pre-existing symlink at `config.json` is no
  longer silently followed and a crash mid-write cannot leave a partially
  written config behind.
- On read, refuse to open `config.json` (or its containing directory) with
  group/world-accessible permissions — the co-tenant scenario where another
  user pre-creates the file with `0o644` before the first login is now
  surfaced as a clear error with the exact `chmod` command to fix it.
- Create the config directory with mode `0o700` and the config file with
  mode `0o600`.
