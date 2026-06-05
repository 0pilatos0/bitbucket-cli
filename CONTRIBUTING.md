# Contributing to Bitbucket CLI

Thanks for your interest in contributing! This guide covers the practical
workflow (setup → branch → changeset → PR). For coding conventions, the
command pattern, DI, and error handling, see [AGENTS.md](AGENTS.md) — it's
the authoritative reference and is kept in sync with the code.

## Development Setup

```bash
git clone https://github.com/0pilatos0/bitbucket-cli.git
cd bitbucket-cli
bun install
bun run dev          # run the CLI locally
```

> The project is **Bun-only** — Node.js is not supported. Install Bun from
> [bun.sh](https://bun.sh) if you don't have it.

Common scripts (full list in [AGENTS.md](AGENTS.md#commands)):

```bash
bun test              # run all tests
bun run test:coverage # run tests with coverage (gated in CI on Linux)
bun run lint          # type-check
bun run format:check  # required by the pre-commit hook
```

## Making a Change

### 1. Branch

```bash
git checkout -b feat/your-feature   # or fix/your-fix
```

Use `feat/` for new features and `fix/` for bug fixes. Other prefixes
(`docs/`, `chore/`, `refactor/`) are fine when they fit.

### 2. Code

- Follow the patterns in `src/commands/` — extend `BaseCommand`, inject
  dependencies via the container. See
  [AGENTS.md → Command Pattern](AGENTS.md#command-pattern).
- Use `IOutputService` for all output, never `console.*`. See
  [AGENTS.md → Output and JSON](AGENTS.md#output-and-json).
- Use `BBError` / `ErrorCode` for expected failures. See
  [AGENTS.md → Error Handling](AGENTS.md#error-handling).
- Add tests next to existing ones in `tests/`.
- Never edit `src/generated/` — regenerate with `bun run generate:api`.

Before pushing:

```bash
bun test
bun run lint
bun run format:check
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
| `major` | Breaking changes (rare pre-1.0)                       |

Commit the generated file in `.changeset/` alongside your code changes.

### 4. Open a Pull Request

- Fill in the PR template
- Link related issues
- Wait for CI to pass

## Dependency Updates

Dependency maintenance is automated with [Renovate](https://docs.renovatebot.com/)
(`renovate.json`), so you generally **don't bump these by hand**:

- npm dependencies for both the root package and `docs/`.
- GitHub Action versions, kept pinned to commit SHAs with a `# vX` comment.
- The pinned `BUN_VERSION` used across the CI workflows.

Renovate batches non-major updates into a single PR on a weekly schedule, opens
separate labelled PRs for major upgrades, and fast-tracks security fixes. It runs
on a weekly schedule with monthly `bun.lock` maintenance. We use Renovate rather
than Dependabot for its Bun lockfile support.

## Release Process

Releases are automated via Changesets:

1. PRs with changesets merge to `main`.
2. A "Version Packages" PR is opened automatically with the version bump
   and CHANGELOG.
3. Merging that PR publishes to npm + GitHub Packages and cuts a GitHub
   Release.

You don't need to bump versions or update the changelog manually — the
changeset you committed is enough.

## Questions?

Open an issue if you're stuck. For deeper convention questions, check
[AGENTS.md](AGENTS.md) first — it covers the runtime, module system,
imports, naming, error handling, DI, and testing setup.
