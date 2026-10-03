---
'@pilatos/bitbucket-cli': minor
---

Safer non-interactive runs. `bb auth login` without a terminal and without an API token now fails fast with error 1001 instead of opening a browser and waiting five minutes. `bb browse` and `bb pr diff --web` print the URL instead of opening a browser when stdout is not a terminal. Every write command and `bb api` accept `--dry-run`, which prints the write request (method, URL, body) and exits 0 without sending it. Under `--json`, info lines go to stderr so stdout stays valid JSON.
