---
"@pilatos/bitbucket-cli": minor
---

Add OAuth 2.0 authentication support

- `bb auth login` now opens the browser for OAuth authorization by default
- API token auth remains available via `bb auth login -u <user> -p <token>` or `--app-password`
- OAuth tokens refresh automatically when expired
- Custom OAuth consumers supported via `--client-id` and `--client-secret`
- `bb auth status` shows authentication method and token expiry
- `bb auth logout` revokes OAuth tokens server-side
- `bb auth token` outputs the active bearer or basic token
