---
'@pilatos/bitbucket-cli': minor
---

Add named accounts and optional OS keychain storage. `bb auth login --account <name>` saves another account, `bb auth switch` changes the active one, and `--account` or `BB_ACCOUNT` picks one for a single command. `bb config set credentialStorage keychain` moves tokens into the macOS Keychain, Windows Credential Manager or libsecret. Existing configs keep working as the `default` account and move to the new layout on the next credential write.
