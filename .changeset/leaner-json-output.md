---
'@pilatos/bitbucket-cli': minor
---

Leaner JSON for scripts and agents. `--json` output is now compact (one line) when stdout is piped or redirected, and stays pretty-printed in a terminal. New `--raw-output` prints `--jq` string results without quotes, like `jq -r`. New opt-in `--lean` trims every Bitbucket `links` map down to the web URL (`links.html`), which removes most of the bytes from list output. `bb auth status --json` now reports `method: "api_token"` for API-token credentials, matching `bb auth login --json` (it previously reported the internal config value `"basic"`).
