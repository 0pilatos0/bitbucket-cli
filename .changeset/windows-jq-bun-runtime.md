---
'@pilatos/bitbucket-cli': patch
---

Prevent `--jq` from hanging on Windows under older Bun versions. Require Bun 1.4.2 or newer for that command, and build standalone releases with Bun 1.4.2.
