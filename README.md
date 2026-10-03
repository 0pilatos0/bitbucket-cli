<p align="center">
  <img src="docs/public/favicon.svg" alt="Bitbucket CLI logo" width="80" height="80">
</p>

<h1 align="center">Bitbucket CLI</h1>

<p align="center">
  <strong>Bitbucket Cloud from your terminal: pull requests, pipelines, repositories and more, with JSON output on every command.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@pilatos/bitbucket-cli"><img src="https://img.shields.io/npm/v/@pilatos/bitbucket-cli.svg?style=flat-square&color=blue" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@pilatos/bitbucket-cli"><img src="https://img.shields.io/npm/dm/@pilatos/bitbucket-cli.svg?style=flat-square&color=blue" alt="npm downloads"></a>
  <a href="https://github.com/0pilatos0/bitbucket-cli/releases/latest"><img src="https://img.shields.io/github/v/release/0pilatos0/bitbucket-cli.svg?style=flat-square&color=blue&label=binaries" alt="Latest release"></a>
  <a href="https://codecov.io/gh/0pilatos0/bitbucket-cli"><img src="https://codecov.io/gh/0pilatos0/bitbucket-cli/graph/badge.svg?token=0J58HCH1PF&style=flat-square" alt="codecov"></a>
  <a href="https://github.com/0pilatos0/bitbucket-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <sub>
    <a href="https://bitbucket-cli.paulvanderlei.com">Docs</a> ·
    <a href="https://bitbucket-cli.paulvanderlei.com/getting-started/quickstart/">Quick Start</a> ·
    <a href="https://bitbucket-cli.paulvanderlei.com/commands/pr/">Command Reference</a> ·
    <a href="https://bitbucket-cli.paulvanderlei.com/help/changelog/">Changelog</a> ·
    <a href="https://github.com/0pilatos0/bitbucket-cli/issues">Issues</a>
  </sub>
</p>

<p align="center">
  <sub>
    <strong>Note:</strong> This is an <strong>unofficial</strong>, community-maintained CLI for Bitbucket Cloud.<br>
    It is not affiliated with or endorsed by Atlassian. Bitbucket Server and Data Center are not supported.
  </sub>
</p>

---

## Why `bb`

- **The whole pull request loop**: create, review, comment, resolve threads, approve and merge without leaving the terminal
- **CI included**: trigger pipelines, follow their logs, inspect deployments and set build statuses
- **Repository admin**: webhooks, branch restrictions, default reviewers, downloads, and your SSH and GPG keys
- **Built for scripts and AI agents**: `--json` on every command, field projection, and a built-in `--jq` (no `jq` binary needed)
- **Zero setup per repo**: workspace and repository are picked up from your git remote
- **Escape hatch**: `bb api` calls any Bitbucket Cloud 2.0 endpoint with your credentials

---

## Install

**Standalone binary** (no runtime needed). Every [GitHub Release](https://github.com/0pilatos0/bitbucket-cli/releases) since v2.2.0 ships `bb` for Linux, macOS and Windows, with a `SHA256SUMS` file and build provenance attestations:

```bash
# macOS Apple silicon; see the installation guide for other platforms and checksum verification
curl -fsSL -o bb https://github.com/0pilatos0/bitbucket-cli/releases/latest/download/bb-darwin-arm64
chmod +x bb && sudo mv bb /usr/local/bin/bb
```

**npm package**, which runs on [Bun](https://bun.sh) 1.1.30 or newer (not Node.js):

```bash
curl -fsSL https://bun.sh/install | bash   # if `bun --version` fails
npm install -g @pilatos/bitbucket-cli      # or: bun install -g / pnpm add -g
```

On Windows, `--jq` needs Bun 1.4.2 or newer.

Then turn on tab completion (optional, recommended) and restart your shell:

```bash
bb completion install
```

Full details: [Installation](https://bitbucket-cli.paulvanderlei.com/getting-started/installation/).

---

## Quick Start

```bash
bb auth login                  # opens your browser to sign in
cd your-bitbucket-checkout
bb pr list
```

```text
ID   TITLE                                   AUTHOR        BRANCHES
---  --------------------------------------  ------------  -----------------------
#47  Stream pipeline logs while a step runs  Ada Lovelace  feat/stream-logs → main
#46  Retry on 429 rate limits                Grace Hopper  fix/retry-429 → main
```

A few more to get a feel for it:

```bash
bb pr create --title "Add feature"     # from the current branch
bb pr checkout 46                      # review it locally
bb pr approve 46
bb pr merge 47 --strategy squash --close-source-branch
bb pipeline run --branch main
bb pipeline logs 313
bb repo cat package.json --ref main    # read a file without cloning
bb browse 42                           # open PR #42 in your browser
bb api /user                           # any Bitbucket API endpoint
```

---

## Commands

| Command                                                                                                                                                                                                                                                                                  | What it does                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`pr`](https://bitbucket-cli.paulvanderlei.com/commands/pr/)                                                                                                                                                                                                                             | Pull requests: create, edit, review, comments, reviewers, checks, diff, merge |
| [`repo`](https://bitbucket-cli.paulvanderlei.com/commands/repo/)                                                                                                                                                                                                                         | Clone, create, list, delete; read files and folders; downloads                |
| [`pipeline`](https://bitbucket-cli.paulvanderlei.com/commands/pipeline/)                                                                                                                                                                                                                 | List, run, stop and view logs of Bitbucket Pipelines                          |
| [`deployment`](https://bitbucket-cli.paulvanderlei.com/commands/deployment/)                                                                                                                                                                                                             | Deployments and environments                                                  |
| [`commit`](https://bitbucket-cli.paulvanderlei.com/commands/commit/)                                                                                                                                                                                                                     | List and inspect commits                                                      |
| [`status`](https://bitbucket-cli.paulvanderlei.com/commands/status/)                                                                                                                                                                                                                     | Read and set build statuses on a commit                                       |
| [`branch-restriction`](https://bitbucket-cli.paulvanderlei.com/commands/branch-restriction/)                                                                                                                                                                                             | Branch protection rules                                                       |
| [`webhook`](https://bitbucket-cli.paulvanderlei.com/commands/webhook/)                                                                                                                                                                                                                   | Repository and workspace webhooks                                             |
| [`search`](https://bitbucket-cli.paulvanderlei.com/commands/search/)                                                                                                                                                                                                                     | Code search across a workspace                                                |
| [`snippet`](https://bitbucket-cli.paulvanderlei.com/commands/snippet/)                                                                                                                                                                                                                   | Snippets and their comments                                                   |
| [`workspace`](https://bitbucket-cli.paulvanderlei.com/commands/workspace/) / [`project`](https://bitbucket-cli.paulvanderlei.com/commands/project/)                                                                                                                                      | Discover workspaces; list, view and create projects                           |
| [`ssh-key`](https://bitbucket-cli.paulvanderlei.com/commands/ssh-key/) / [`gpg-key`](https://bitbucket-cli.paulvanderlei.com/commands/gpg-key/)                                                                                                                                          | Keys on your own account                                                      |
| [`browse`](https://bitbucket-cli.paulvanderlei.com/commands/browse/)                                                                                                                                                                                                                     | Open a repo, file, PR or commit in your browser                               |
| [`api`](https://bitbucket-cli.paulvanderlei.com/commands/api/)                                                                                                                                                                                                                           | Authenticated request to any Bitbucket Cloud 2.0 endpoint                     |
| [`auth`](https://bitbucket-cli.paulvanderlei.com/commands/auth/), [`config`](https://bitbucket-cli.paulvanderlei.com/commands/config/), [`alias`](https://bitbucket-cli.paulvanderlei.com/commands/alias/), [`completion`](https://bitbucket-cli.paulvanderlei.com/commands/completion/) | Login, settings, command shortcuts, shell completion                          |

Use `-w/--workspace` and `-r/--repo` to select the target for commands that need workspace or repository context. Run `bb help <command>` for flags and examples, or see [Global Flags](https://bitbucket-cli.paulvanderlei.com/reference/global-flags/).

---

## Scripting with `--json` and `--jq`

`--json` accepts an optional comma-separated field list, and `--jq` filters the result in-process:

```bash
# Only the fields you need
bb pr list --json id,title,state

# Filter with the built-in jq
bb pr list --json --jq '.pullRequests[] | select(.author.display_name == "Ada Lovelace") | .id'

# Capture a value
build=$(bb pipeline run --branch main --json --jq '.pipeline.build_number')
```

Command prompts are disabled when stdin or stdout is not a terminal, with `--json`, or with `--no-input`. The completion installer has its own interactive prompts. See [JSON Output](https://bitbucket-cli.paulvanderlei.com/reference/json-output/), the [Scripting guide](https://bitbucket-cli.paulvanderlei.com/guides/scripting/) and [CI/CD](https://bitbucket-cli.paulvanderlei.com/guides/cicd/).

---

## Authentication

Interactive login lets you choose OAuth or an API token. API-token login uses your Atlassian account email, even though the flag is named `--username` and the environment variable is `BB_USERNAME`.

- **OAuth (default)**: `bb auth login` opens your browser. Tokens refresh automatically. The browser must reach the callback on this machine. Use API-token login on headless hosts.
- **API token** (CI and headless hosts): create one in your [Bitbucket settings](https://bitbucket.org/account/settings/api-tokens/), then:

  ```bash
  printf '%s' "$BB_API_TOKEN" | bb auth login -u you@example.com --with-token
  ```

OAuth permissions come from the consumer configured in Bitbucket. For workflows that need other permissions, use a scoped API token or a custom consumer; see [Token Scopes](https://bitbucket-cli.paulvanderlei.com/reference/token-scopes/).

Bitbucket app passwords [stopped working on July 28, 2026](https://developer.atlassian.com/cloud/bitbucket/changelog/). If you still log in with one, switch to OAuth or an API token.

More: [Authentication](https://bitbucket-cli.paulvanderlei.com/getting-started/authentication/).

---

## Configuration

The variables you're most likely to need:

| Variable                       | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `BB_USERNAME` / `BB_API_TOKEN` | Credentials picked up by `bb auth login`, handy in CI                          |
| `BB_WORKSPACE`                 | Default workspace when you're not inside a checkout                            |
| `BB_DEBUG`                     | `http` traces every API call with status and timing; `verbose` adds the bodies |

Persistent settings live in `bb config` (for example `bb config set defaultWorkspace myworkspace`). Everything else, including timeouts, locale and color: [Environment Variables](https://bitbucket-cli.paulvanderlei.com/reference/environment-variables/) and [Configuration](https://bitbucket-cli.paulvanderlei.com/reference/configuration/).

---

## Documentation

Full docs live at **[bitbucket-cli.paulvanderlei.com](https://bitbucket-cli.paulvanderlei.com)**:

- [Quick Start](https://bitbucket-cli.paulvanderlei.com/getting-started/quickstart/) and [Command Reference](https://bitbucket-cli.paulvanderlei.com/commands/pr/)
- Guides: [Scripting](https://bitbucket-cli.paulvanderlei.com/guides/scripting/), [CI/CD](https://bitbucket-cli.paulvanderlei.com/guides/cicd/), [AI agents](https://bitbucket-cli.paulvanderlei.com/guides/ai-agents/) (Claude Code, opencode, Cursor, Windsurf)
- [Recipes](https://bitbucket-cli.paulvanderlei.com/recipes/) for common automation
- [Troubleshooting](https://bitbucket-cli.paulvanderlei.com/help/troubleshooting/), [FAQ](https://bitbucket-cli.paulvanderlei.com/help/faq/) and [Changelog](https://bitbucket-cli.paulvanderlei.com/help/changelog/)

---

## Contributing

Read the [Contributing Guide](CONTRIBUTING.md) to get started.

---

## Acknowledgments

- Inspired by [GitHub CLI (`gh`)](https://cli.github.com/)
- Runs on [Bun](https://bun.sh), built with [Commander.js](https://github.com/tj/commander.js)
- API client generated from the [Bitbucket Cloud REST API](https://developer.atlassian.com/cloud/bitbucket/rest/) OpenAPI spec

---

## License

MIT License. See [LICENSE](LICENSE) for details.
