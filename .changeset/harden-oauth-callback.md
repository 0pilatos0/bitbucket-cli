---
'@pilatos/bitbucket-cli': patch
---

security: harden OAuth callback flow

- Bind the local OAuth callback server to `127.0.0.1` instead of all
  interfaces so the auth window is not reachable from the LAN.
- Bump the OAuth `state` parameter from 128 to 256 bits.
- Add a 10s timeout to every `fetch()` in the OAuth flow (token exchange,
  refresh, revoke, user-info) so a hung Bitbucket endpoint cannot stall
  the CLI indefinitely.
- Surface token-revocation failures on logout as a warning instead of
  silently dropping them; local credentials are still cleared.
