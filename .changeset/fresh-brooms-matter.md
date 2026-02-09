---
'@pilatos/bitbucket-cli': patch
---

Fix `bb auth logout` and failed `bb auth login` cleanup to remove only
authentication fields (`username` and `apiToken`) while preserving other
configuration values.
