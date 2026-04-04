---
"@pilatos/bitbucket-cli": patch
---

Fix documentation inaccuracies, remove bloat, and improve clarity across docs site

- Fix hardcoded version 1.4.0 in Head.astro structured data (now reads from package.json)
- Remove stale meta keywords tag (ignored by search engines since 2009)
- Add missing `lastVersionCheck` config key to reference docs
- Fix incorrect API token scope names in CI/CD and AI agents guides
- Add warning about misleading `--app-password` flag name in auth docs
- Add prominent caution about `--mine` filtering by reviewer, not author
- Clarify Bun runtime requirement in README (installed via npm, runs on Bun)
- Document built-in retry logic (3x exponential backoff on 429/502/503/504)
- Document automatic OAuth token refresh behavior
- Improve DEBUG environment variable description
- Fix `repo delete --yes` docs (not an interactive prompt, flag is required)
- Remove generic "Team Conventions" section from AI agents guide
- Trim scripting guide (remove 2 complex examples and Python/Node.js sections)
- Replace padding GitHub vs Bitbucket CLI comparison table in FAQ
- Update stale version numbers in example notification output
