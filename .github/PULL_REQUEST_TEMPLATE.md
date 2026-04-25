<!--
Thanks for contributing! Please fill out the sections below.
For setup, conventions, and the changeset workflow see CONTRIBUTING.md and AGENTS.md.
-->

## Summary

<!-- What does this PR do, and why? Link issues with "Closes #123" or "Refs #123". -->

## Type of change

<!-- Check all that apply. -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing usage to change)
- [ ] Documentation only
- [ ] CI / build / tooling
- [ ] Refactor (no behavior change)

## Changes

<!-- Bulleted list of the user-visible changes. Mention new commands/flags. -->

-

## Testing

<!-- How did you verify this works? Include commands run and any relevant output. -->

- [ ] `bun test` passes
- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] Manually exercised the affected command(s)

## Changeset

<!-- See CONTRIBUTING.md#3-add-a-changeset for when this is required. -->

- [ ] I ran `bun run changeset` and committed the file, **or**
- [ ] This change does not affect users (CI, tests, internal docs only)

## Checklist

- [ ] Branch is named `feat/...` or `fix/...`
- [ ] No edits to `src/generated/` (regenerated via `bun run generate:api` if needed)
- [ ] Output uses `IOutputService` (no `console.*`)
- [ ] Expected failures use `BBError` / `ErrorCode`
- [ ] Docs updated if user-facing behavior changed

## Screenshots / output

<!-- Optional. Paste terminal output, screenshots, or recordings if helpful. -->
