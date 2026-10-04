# Contributing to Bitbucket CLI

Thanks for your interest in contributing! This guide covers the practical
workflow (setup → branch → changeset → PR). For coding conventions, the
command pattern, DI, and error handling, see [AGENTS.md](AGENTS.md); it's
the authoritative reference and is kept in sync with the code.

## Development setup

```bash
git clone https://github.com/0pilatos0/bitbucket-cli.git
cd bitbucket-cli
bun install
bun run dev          # run the CLI locally
```

> The project is **Bun-only**; Node.js is not supported. Install Bun from
> [bun.sh](https://bun.sh) if you don't have it.

Common scripts (full list in [AGENTS.md](AGENTS.md#commands)):

```bash
bun run check         # lint, lint:docs, format:check and all tests
bun run test:coverage # run tests with coverage (gated in CI on Linux)
```

`bun install` installs a pre-commit hook that runs `format:check`, `lint` and
`lint:docs`. Set `SKIP_SIMPLE_GIT_HOOKS=1` to bypass it for a single commit.

## Documentation site

The CLI runs on Bun. The Astro documentation tools also need Node.js >=22.12.
Install the docs dependencies separately:

```bash
cd docs
bun install
cd ..
bun run docs:dev
```

Before submitting documentation changes:

```bash
bun run lint:docs
bun run docs:build
```

Check copied commands against `bb <command> --help` and preserve existing
heading anchors when moving sections. Keep scopes, global flags, JSON behavior
and configuration rules in their reference pages; link to them from guides.

## Making a change

### 1. Branch

```bash
git checkout -b feat/your-feature   # or fix/your-fix
```

Prefixes are listed in
[AGENTS.md → Changesets and Branches](AGENTS.md#changesets-and-branches).

### 2. Code

Follow [AGENTS.md](AGENTS.md) for code and
[tests/AGENTS.md](tests/AGENTS.md) for tests. New command? Run
`bun run new:command <group> <verb>` and follow the checklist in
[src/commands/AGENTS.md](src/commands/AGENTS.md).

Before pushing:

```bash
bun run check
bun run check:api-contract   # only if you touched the spec or generator; needs Java 21
```

### 3. Add a Changeset

**Required** for any change that affects users (commands, flags, output,
config, errors). Skip only for CI/workflow tweaks, README edits, or
test-only changes.

```bash
bun run changeset
```

Pick the bump type:

| Type    | Use for                                               |
| ------- | ----------------------------------------------------- |
| `patch` | Bug fixes, doc updates, small improvements            |
| `minor` | New features, new commands, non-breaking enhancements |
| `major` | Breaking changes                                      |

Commit the generated file in `.changeset/` alongside your code changes. If
you write it by hand, the package name must be exactly
`'@pilatos/bitbucket-cli'` (see
[AGENTS.md → Changesets and Branches](AGENTS.md#changesets-and-branches)).

CI fails a PR that changes `src/` without a changeset, and any changeset whose
frontmatter names another package or an unknown bump type. If a `src/` change
really does not affect users (a pure refactor, say), a maintainer adds the
`no-changeset` label to waive the requirement.

### 4. Open a Pull Request

- Fill in the PR template
- Link related issues
- Wait for CI to pass

## Dependency Updates

Dependencies are updated by hand. Run `bun outdated` in the root and in `docs/`,
bump what you need, and commit the manifest together with `bun.lock`. GitHub
Actions stay pinned to commit SHAs with a `# vX` comment; Dependabot opens a
weekly PR to bump them. Every workflow installs the Bun version in
`.bun-version`, so bump it there. The `engines.bun` floor in `package.json` is
checked by the "Minimum Bun" CI job, which runs the built CLI on that version.

## Release Process

Releases are automated via Changesets:

1. PRs with changesets merge to `main`.
2. A "Version Packages" PR is opened automatically with the version bump
   and CHANGELOG. Its checks come from CI, Docs lint and Changeset runs that
   the Release workflow dispatches (`workflow_dispatch`). The `pull_request` runs for that
   PR show up in the Actions tab as awaiting approval and later expire as
   failures. They cannot be turned off while the PR is opened with
   `GITHUB_TOKEN`; avoiding them would need a stored PAT or GitHub App secret
   with write access, which we chose not to add. They report no checks, so
   they do not block the merge and can be ignored.
3. Merging that PR publishes to npm + GitHub Packages and cuts a GitHub
   Release.

On every push to `main`, the Release workflow first runs the full CI matrix
(`ci.yml`, called as a reusable workflow) on that commit. Nothing is
versioned, tagged or published unless it passes, including the manual
`publish_only` re-publish. CI has no push trigger of its own; on `main` it
runs inside the Release run.

You don't need to bump versions or update the changelog manually; the
changeset you committed is enough.

## Questions?

Open an issue if you're stuck. For deeper convention questions, check
[AGENTS.md](AGENTS.md) first; it covers the runtime, module system,
imports, naming, error handling, DI, and testing setup.
