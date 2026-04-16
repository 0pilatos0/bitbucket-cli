<p align="center">
  <img src="docs/public/favicon.svg" alt="Bitbucket CLI logo" width="80" height="80">
</p>

<h1 align="center">Bitbucket CLI</h1>

<p align="center">
  <strong>Fast, scriptable CLI for Bitbucket Cloud</strong>
</p>

<p align="center">
  <em>Inspired by GitHub's <code>gh</code> CLI - the same great experience for Bitbucket</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@pilatos/bitbucket-cli"><img src="https://img.shields.io/npm/v/@pilatos/bitbucket-cli.svg?style=flat-square&color=blue" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@pilatos/bitbucket-cli"><img src="https://img.shields.io/npm/dm/@pilatos/bitbucket-cli.svg?style=flat-square&color=blue" alt="npm downloads"></a>
  <a href="https://github.com/0pilatos0/bitbucket-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://github.com/0pilatos0/bitbucket-cli/issues"><img src="https://img.shields.io/github/issues/0pilatos0/bitbucket-cli.svg?style=flat-square" alt="GitHub issues"></a>
</p>

<p align="center">
  <sub>
    <a href="https://bitbucket-cli.paulvanderlei.com">Docs</a> ·
    <a href="https://bitbucket-cli.paulvanderlei.com/getting-started/quickstart/">Quick Start</a> ·
    <a href="https://bitbucket-cli.paulvanderlei.com/commands/auth/">Command Reference</a> ·
    <a href="https://github.com/0pilatos0/bitbucket-cli/issues">Issues</a>
  </sub>
</p>

<p align="center">
  <sub>
    <strong>Note:</strong> This is an <strong>unofficial</strong>, community-maintained CLI tool.<br>
    It is not affiliated with or endorsed by Atlassian or Bitbucket.
  </sub>
</p>

---

## At a glance

- Stay in the terminal for repo, PR, and snippet workflows
- JSON output for scripting and automation
- Auto-detects workspace and repo from your git directory

---

## Install

```bash
npm install -g @pilatos/bitbucket-cli
```

```bash
bb --version
```

> **Requires:** [Bun](https://bun.sh) runtime 1.0 or higher. The CLI is installed via npm but runs on the Bun runtime — Node.js is not supported. Install Bun first: `curl -fsSL https://bun.sh/install | bash`

---

## Quick Start

```bash
bb auth login
bb repo clone myworkspace/myrepo
bb pr list
```

---

## Common Commands

```bash
bb repo list
bb pr create --title "Add feature"
bb pr approve 42
bb config set defaultWorkspace myworkspace
```

**Global options:** `--json`, `--no-color`, `-w, --workspace`, `-r, --repo`

---

## Docs

Full documentation: **[bitbucket-cli.paulvanderlei.com](https://bitbucket-cli.paulvanderlei.com)**

- [Quick Start Guide](https://bitbucket-cli.paulvanderlei.com/getting-started/quickstart/)
- [Command Reference](https://bitbucket-cli.paulvanderlei.com/commands/auth/)
- [Guides](https://bitbucket-cli.paulvanderlei.com/guides/scripting/) (Scripting, CI/CD)
- [Help](https://bitbucket-cli.paulvanderlei.com/help/troubleshooting/) (Troubleshooting, FAQ)

---

## Authentication

- Create a token: [Bitbucket API Tokens](https://bitbucket.org/account/settings/api-tokens/)
- Authenticate: `bb auth login`

> **Note:** Bitbucket app passwords are [deprecated](https://bitbucket.org/blog/deprecating-app-passwords) (new ones can no longer be created). Use OAuth or API tokens instead.

---

## Contributing

Read the [Contributing Guide](CONTRIBUTING.md) to get started.

---

## Acknowledgments

- Inspired by [GitHub CLI (`gh`)](https://cli.github.com/)
- Built with [Commander.js](https://github.com/tj/commander.js)
- Uses the [Bitbucket Cloud REST API](https://developer.atlassian.com/cloud/bitbucket/rest/)

---

## License

MIT License - see [LICENSE](LICENSE) for details.
