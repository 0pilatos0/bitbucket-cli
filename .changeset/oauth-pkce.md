---
'@pilatos/bitbucket-cli': patch
---

security: add PKCE (S256) to the OAuth authorization-code flow. The CLI now generates a per-login `code_verifier`, sends `code_challenge` + `code_challenge_method=S256` on the authorize redirect, and supplies the verifier on token exchange. An attacker who intercepts only the authorization code can no longer redeem it.
