---
'@pilatos/bitbucket-cli': major
---

Remove the issue-tracker surface: Atlassian removed the native Bitbucket Cloud issue tracker (and wikis) on August 20, 2026, and the issue-tracker API endpoints no longer exist.

- **Removed `bb issue`** (`list`, `view`, `create`, `edit`, `close`, `comment`). Native issues are gone from Bitbucket Cloud; Atlassian recommends Jira for issue tracking ([sunset announcement](https://community.atlassian.com/forums/Bitbucket-articles/Announcing-sunset-of-Bitbucket-Issues-and-Wikis/ba-p/3193882)).
- **Removed `bb browse --issue`, `--issues`, and `--wiki`** — those bitbucket.org pages no longer exist.
- **`bb workspace list` now lists your workspace memberships** via `GET /2.0/user/workspaces`, because `GET /2.0/workspaces` was also removed from the API. The table shows `SLUG`, `UUID`, and `ADMIN` (workspace `name`/privacy are not part of the membership payload — use `bb workspace view <slug>`), and the `--role` filter is gone.
- Updated the pinned Bitbucket Cloud spec and regenerated the API client from it.

Scripts that called the removed commands or flags need migrating; everything else is unchanged.
