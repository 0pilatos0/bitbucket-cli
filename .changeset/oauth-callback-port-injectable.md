---
'@pilatos/bitbucket-cli': patch
---

The OAuth callback server now builds its `redirect_uri` from the port it actually bound, and the port can be injected. `bb auth login` still uses `http://localhost:19872/callback`. The OAuth tests now bind an ephemeral port, so parallel test runs and a running `bb auth login` no longer break them. The troubleshooting docs explain why there is no fallback port.
