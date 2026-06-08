---
'@pilatos/bitbucket-cli': patch
---

Advertise the global `--jq` flag in shell completion. It was a documented root option but was missing from the completion output, so `bb <tab>` never suggested it.

Internally, a new drift-guard test now walks the live Commander command tree and fails CI if the JSON `WRAPPER_ARRAY_KEYS` registry falls out of sync with the commands — turning a silent maintenance hazard into a build failure.
