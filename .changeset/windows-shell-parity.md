---
'@pilatos/bitbucket-cli': minor
---

Add `bb completion <bash|zsh|fish|powershell>`, which prints the completion script to stdout, including new PowerShell completion with help-text tooltips. `!` shell aliases now run in PowerShell on Windows when `sh` isn't on PATH, with the arguments in `$args`.
