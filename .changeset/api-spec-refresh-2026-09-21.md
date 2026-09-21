---
'@pilatos/bitbucket-cli': patch
---

Refresh the pinned Bitbucket Cloud spec and regenerate the API client

- Update `specs/bitbucket-cloud.json` to upstream revision `bfe4e1ee8053`
- Drop the deprecated `GET /repositories` operation (and its `RepositoriesGetRoleEnum`) from `src/generated/`; the CLI never exposed it
- Track the addon client-key endpoint's OAuth scope change to `read:workspace:bitbucket`
