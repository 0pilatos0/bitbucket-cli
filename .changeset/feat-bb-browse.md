---
'@pilatos/bitbucket-cli': minor
---

Add `bb browse` command for opening Bitbucket Cloud pages in the browser.

Mirrors `gh browse`: `bb browse` opens the repo home, `bb browse src/cli.ts:42` opens a file at a line, `bb browse 217` opens PR #217, `bb browse abc1234` opens a commit, and resource flags (`--pr`, `--prs`, `--branch`, `--branches`, `--commit`, `--commits`, `--pipelines`, `--pipeline`, `--downloads`, `--issues`, `--issue`, `--wiki`, `--settings`) target specific pages. Use `--no-browser` to print the URL or `--json url` for scripting. Adds a reusable `UrlBuilderService` for centralized Bitbucket URL construction and `GitService.getCurrentCommit()` for HEAD-commit defaulting.
