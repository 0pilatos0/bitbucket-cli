---
'@pilatos/bitbucket-cli': patch
---

Honor `--limit` across paginated PR and repository list commands, including PR activity and PR comments. Also improve `bb pr diff` and `bb pr edit` auto-detection so they can find matching pull requests across multiple pages.
