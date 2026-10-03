## Bitbucket CLI

Use `bb` for Bitbucket Cloud operations.

- Run `bb help --json` for every command, argument, flag, choice, default and
  example. Run `bb <group> <command> --help` before using unfamiliar flags.
- Run `bb context --json` to see which workspace, repository and branch
  repository commands will use, and where each came from. Pass -w and -r
  explicitly when operating outside that checkout, and -w for workspace-only
  commands such as `bb repo list` and `bb snippet list`.
- Use `--json` after the command for structured output. Use `--all` on list
  commands that support it when the task needs every result.
- Read PRs with `bb pr view <id>`, `bb pr diff <id>`, and
  `bb pr comments list <id> --all --unresolved`.
- `bb pr checks <id>` reads one page of build statuses. For automation,
  use the documented paginated API recipe rather than treating it as complete.
- Use `bb api <endpoint>` for operations without a typed command.
- Follow the user's approval rules before posting comments, approving,
  pushing, merging, or deleting resources.
- Never read, print, or copy credentials. Ask the user to authenticate.
