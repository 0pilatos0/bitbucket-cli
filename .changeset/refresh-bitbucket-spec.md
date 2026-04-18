---
'@pilatos/bitbucket-cli': patch
---

Refresh the generated Bitbucket Cloud API client from the latest spec. Adds a post-generation patch script that dedupes duplicate enum declarations and corrects `PipelineSelector.type` optionality so the generated output type-checks. Call-site adjustments only (no user-facing behavior change): the renamed OpenAPI request-body parameters (`body` → `pullrequest` / `pullrequestComment` / `pullrequestMergeParameters` / `repository` / `snippetComment`) are now used, and `Participant.state`'s new nullable type is coerced where consumed.
