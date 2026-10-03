# tests/AGENTS.md

Test conventions. The root `AGENTS.md` still applies.

## Layout and naming

- Files mirror `src/`: `tests/commands/`, `tests/services/`, `tests/core/`;
  end-to-end tests against the mock server live in `tests/integration/`
- Name files `<name>.test.ts` (or `<name>.expanded.test.ts` for extra cases
  split out of a large file); name tests after behavior, not implementation
- `dist-jq.smoke.test.ts` and `compile.smoke.test.ts` build the CLI and are
  slow

## What runs before every test

- `tests/preload.ts` (wired in `bunfig.toml`) runs before any test file:
  it strips real `BB_*` variables, forces color off, and replaces `fetch`
  with a guard that only allows `localhost`. Set any `BB_*` variable you need
  inside the test and restore it afterwards.
- `tests/setup.ts` is NOT preloaded. Bun evaluates it once per run, so its
  `beforeEach`/`afterEach` hooks (reset the DI `Container`, `NODE_ENV`,
  `process.exitCode`) only attach to the first test file that imports it.
  Don't rely on them: a test that registers into the container, sets
  `NODE_ENV` or checks `process.exitCode` resets that state itself (see
  `tests/core/container.test.ts`).

## Fakes

- `tests/setup.ts` holds shared mock factories (`createMockConfigService`,
  `createMockOutputService`, `createMockContextService`, axios adapters,
  fixtures like `mockPullRequest`). Reuse them before writing a local one.
- `tests/helpers/mock-bitbucket.ts` starts a `Bun.serve` fake of the
  Bitbucket API and builds real generated `*Api` clients against it
  (`startMockBitbucket`, `buildApiFor`, `paginatedEnvelope`). It exercises
  request serialization, pagination and the axios interceptors, so prefer it
  when a test cares about the wire format. Stop every server in `afterAll`.

## Known issue

- `tests/services/oauth.service.test.ts` binds the fixed port 19872, so two
  `bun test` runs on one machine (parallel worktrees) can collide. Rerun when
  only those tests fail with port errors or timeouts.
