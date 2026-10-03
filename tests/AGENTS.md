# tests/AGENTS.md

Test conventions. The root `AGENTS.md` still applies.

## Layout and naming

- Files mirror `src/`: `tests/commands/`, `tests/services/`, `tests/core/`;
  end-to-end tests against the mock server live in `tests/integration/`
- Name files `<name>.test.ts` (or `<name>.expanded.test.ts` for extra cases
  split out of a large file); name tests after behavior, not implementation
- A command group with many subcommands gets a folder, one file per
  subcommand (`tests/commands/pr/<sub>.test.ts`) plus a `fakes.ts` for the
  fakes they share
- `dist-jq.smoke.test.ts` and `compile.smoke.test.ts` build the CLI and are
  slow

## What runs before every test

- `tests/preload.ts` (wired in `bunfig.toml`) runs before any test file:
  it strips real `BB_*` variables, forces color off, replaces `fetch`
  with a guard that only allows `localhost`, and resets `process.exitCode`
  after every test. Set any `BB_*` variable you need
  inside the test and restore it afterwards.
- `tests/setup.ts` is NOT preloaded. Bun evaluates it once per run, so its
  `beforeEach`/`afterEach` hooks (reset the DI `Container` and `NODE_ENV`)
  only attach to the first test file that imports it. Don't rely on them: a
  test that registers into the container or sets `NODE_ENV` resets that
  state itself (see `tests/core/container.test.ts`). A test that asserts
  `process.exitCode` stays unset should accept `undefined` (it starts that
  way in each file's first test).

## Fakes

- New command tests default to the mock Bitbucket server:
  `startCommandHarness(routes)` from `tests/helpers/mock-bitbucket.ts` starts
  a `Bun.serve` fake of the API and returns a recording output service plus
  `api(SomeApi)`, which builds a real generated client against it. Assert on
  `server.requests` and the output. It exercises request serialization,
  pagination and the axios interceptors. Stop every server in `afterAll`. See
  `tests/integration/admin-commands.test.ts`; the lower-level pieces are
  `startMockBitbucket`, `buildApiFor` and `paginatedEnvelope`.
- When a unit test needs a stub at the API-class boundary instead, use
  `fakeApi<SomeApi>({...})` and `fakeUsersApi()` from
  `tests/helpers/fake-api.ts`, not `as unknown as SomeApi`, so the
  type-checker can match method names and parameters against the generated
  client. `axiosResponse()` and `extractPaginationParams()` live there too.
- Read what `createMockOutputService()` recorded with `getTableRows()` and
  `getJsonPayload()` from `tests/helpers/output-logs.ts`.
- `tests/setup.ts` holds shared mock factories (`createMockConfigService`,
  `createMockOutputService`, `createMockContextService`, axios adapters,
  fixtures like `mockPullRequest`). Reuse them before writing a local one.

## Known issue

- `tests/services/oauth.service.test.ts` binds the fixed port 19872, so two
  `bun test` runs on one machine (parallel worktrees) can collide. Rerun when
  only those tests fail with port errors or timeouts.
