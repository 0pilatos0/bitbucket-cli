# Contributing to Bitbucket CLI

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/0pilatos0/bitbucket-cli.git
   cd bitbucket-cli
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Run in development mode**
   ```bash
   bun run dev
   ```

## Commands

| Command         | Description                 |
| --------------- | --------------------------- |
| `bun run dev`   | Run CLI in development mode |
| `bun run build` | Build for production        |
| `bun test`      | Run tests                   |
| `bun run lint`  | Type-check with TypeScript  |

## Making Changes

### 1. Create a branch

```bash
git checkout -b feat/your-feature
# or
git checkout -b fix/your-fix
```

### 2. Make your changes

- Follow existing code patterns
- Add tests for new functionality
- Ensure all tests pass: `bun test`
- Ensure types are correct: `bun run lint`
- Ensure formatting is valid: `bun run format:check`

### 3. Add a changeset

**This is required for all PRs that affect the package.**

```bash
bun run changeset
```

This will prompt you to:

1. Select the type of change (patch, minor, major)
2. Write a summary of your changes

A changeset file will be created in `.changeset/` - commit this with your PR.

#### When to use each version type

- **patch** - Bug fixes, documentation updates, small improvements
- **minor** - New features, new commands, non-breaking enhancements
- **major** - Breaking changes (rarely used before v1.0)

#### Skipping changesets

Only skip changesets for changes that don't affect users:

- CI/workflow changes
- README updates
- Test-only changes

### 4. Submit a Pull Request

- Fill out the PR template
- Link any related issues
- Wait for CI to pass
- Request review if needed

## Code Style

- Use TypeScript
- Follow the command pattern in `src/commands/`
- Use dependency injection via the container
- Use standard Promises and throw errors for failure cases
- Keep functions small and focused

## Architecture

```
src/
├── commands/       # CLI commands (one per file)
├── core/           # DI container, interfaces
├── generated/      # Auto-generated API client from OpenAPI spec
├── services/       # Business logic
└── types/          # TypeScript types
```

## Release Process

Releases are automated via changesets:

1. PRs with changesets get merged to `main`
2. A "Version Packages" PR is automatically created
3. Merging that PR triggers:
   - Version bump
   - CHANGELOG update
   - npm publish (primary package distribution)
   - GitHub Packages publish
   - GitHub Release creation

## Questions?

Open an issue if you have questions or need help getting started.
