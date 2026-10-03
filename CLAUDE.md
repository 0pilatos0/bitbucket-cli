@AGENTS.md

## Claude Code notes

- `AGENTS.md` is the single source of truth; change rules there, not here.
- Claude Code does not read nested `AGENTS.md` files, so each one gets a
  sibling `CLAUDE.md` containing only `@AGENTS.md` (see `tests/CLAUDE.md`).
