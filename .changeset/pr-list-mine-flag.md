---
'@pilatos/bitbucket-cli': minor
---

Add `--mine` flag to `bb pr list` for filtering PRs assigned to current user

- New `--mine` flag filters pull requests to show only those where the authenticated user is listed as a reviewer
- User UUID is automatically fetched and cached for optimal performance
- Works in combination with existing `--state` and `--limit` flags
- Example usage: `bb pr list --mine` or `bb pr list --mine --state OPEN`

Closes #79
