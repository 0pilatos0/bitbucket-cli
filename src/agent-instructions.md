## Bitbucket CLI

Use `bb` for Bitbucket Cloud operations.

- Run `bb help --json` for every command, argument, flag, choice, default and
  example. Run `bb <group> <command> --help` before using unfamiliar flags.
- Run `bb context --json` to see which workspace, repository and branch
  repository commands will use, and where each came from (the workspace
  and repository come from the Bitbucket git remote). Pass -w and -r
  explicitly when operating outside that checkout, and -w for workspace-only
  commands such as `bb repo list` and `bb snippet list`.
- Use `--json` after the command for structured output. Use `--all` on list
  commands that support it when the task needs every result. Add `--lean` to
  drop link noise, or `--jq <filter> --raw-output` to get plain strings.
- Read PRs with `bb pr view <id>`, `bb pr diff <id>`, and
  `bb pr comments list <id> --all --unresolved`.
- `bb pr checks <id>` reads every build status. `bb pr checks <id> --watch`
  waits until none is in progress and exits non-zero if any failed;
  `bb pipeline watch` does the same for a pipeline run.
- Use `bb api <endpoint>` for operations without a typed command.
- Follow the user's approval rules before posting comments, approving,
  pushing, merging, or deleting resources.
- Add `--dry-run` to a write command to show the exact request (method, URL,
  body) without sending it.
- Never read, print, or copy credentials. Ask the user to authenticate.
  Without a terminal, `bb auth login` fails with code 1001 instead of opening
  a browser.
