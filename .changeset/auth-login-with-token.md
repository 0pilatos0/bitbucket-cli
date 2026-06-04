---
'@pilatos/bitbucket-cli': minor
---

Add `bb auth login --with-token` to read an API token from stdin, so secrets never appear in shell history or `ps` output the way `-p, --password` does. Pipe the token in, e.g. `echo "$BB_API_TOKEN" | bb auth login -u myuser --with-token` — it pairs well with secret managers. Combining `--with-token` with `--password` is rejected, and an empty stdin produces a clear error. Docs also now note that OAuth requires a loopback browser (`http://localhost:19872/callback`) with no device-code flow, so headless users know to use token auth.
