---
'@pilatos/bitbucket-cli': patch
---

docs: improve docs site navigation, cross-linking, and discoverability

Several small surface-level fixes that together close the gap between "I had to
search" and "I clicked the obvious link". Resolves [#186](https://github.com/0pilatos0/bitbucket-cli/issues/186).

- **Changelog page in docs**: new `/help/changelog/` page with a curated
  summary of recent releases plus a link to the full GitHub `CHANGELOG.md`.
  Surfaced in the sidebar under Help.
- **AI Agents guide linked from README**: the substantial `guides/ai-agents`
  page is now mentioned under the README's Docs section so it's discoverable
  from the npm/GitHub landing.
- **`See also` section in `bb --help`**: extends `buildHelpText()` with a new
  `seeAlso` config that renders a labeled list of doc URLs. Wired up on the
  global help, `bb pr list`, `bb pr create`, `bb config get`, and
  `bb config set` to point users at the relevant guide.
- **`bb config list` advertises settable keys**: after the values table, the
  command appends `Settable keys: defaultWorkspace, skipVersionCheck, ...`
  so users discover what they can change without reading `--help` separately.
- **Stable anchor for `bb repo default-reviewers`**: explicit `<a id="...">`
  before the heading so the cross-link from `pr/create-and-edit` survives any
  future Starlight slug-generator change.
- **Quickstart documents the version-check nudge**: explains what the upgrade
  message means and how to silence it (`bb config set skipVersionCheck true`).
- **CLAUDE.md uses a real markdown link to AGENTS.md**: replaces the
  Claude-specific `@AGENTS.md` syntax (which doesn't render as a link in
  generic markdown viewers) with `[AGENTS.md](AGENTS.md)` and adds a "must
  read" pointer list.
