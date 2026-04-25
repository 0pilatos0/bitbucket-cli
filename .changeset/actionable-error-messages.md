---
'@pilatos/bitbucket-cli': minor
---

Make error messages actionable with next-step guidance: auth errors mention both `bb auth login` and the `BB_USERNAME`/`BB_API_TOKEN` env vars; `CONTEXT_REPO_NOT_FOUND` distinguishes between not being in a git repo, missing remote, and non-Bitbucket remotes; 404s on `bb pr view`, `bb repo view`, and `bb snippet view` now name the missing resource; network errors point to `DEBUG=true` and proxy/CA troubleshooting; `bb config get` for hidden keys explains why and points at `bb config list`; `bb pr create` validation includes a `--help` footer; `bb auth login` distinguishes invalid credentials from rate limiting; `bb pr comment` lists the three valid mode combinations.
