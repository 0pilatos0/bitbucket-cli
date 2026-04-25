# Changelog

## 1.16.0

### Minor Changes

- [#217](https://github.com/0pilatos0/bitbucket-cli/pull/217) [`d6c532f`](https://github.com/0pilatos0/bitbucket-cli/commit/d6c532faa980da2e5f8e2c4cfa49e88f18aabbdc) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add `bb browse` command for opening Bitbucket Cloud pages in the browser.

  Mirrors `gh browse`: `bb browse` opens the repo home, `bb browse src/cli.ts:42` opens a file at a line, `bb browse 217` opens PR [#217](https://github.com/0pilatos0/bitbucket-cli/issues/217), `bb browse abc1234` opens a commit, and resource flags (`--pr`, `--prs`, `--branch`, `--branches`, `--commit`, `--commits`, `--pipelines`, `--pipeline`, `--downloads`, `--issues`, `--issue`, `--wiki`, `--settings`) target specific pages. Use `--no-browser` to print the URL or `--json url` for scripting. Adds a reusable `UrlBuilderService` for centralized Bitbucket URL construction and `GitService.getCurrentCommit()` for HEAD-commit defaulting.

### Patch Changes

- [#219](https://github.com/0pilatos0/bitbucket-cli/pull/219) [`145212b`](https://github.com/0pilatos0/bitbucket-cli/commit/145212b15344db872bacdac3d007d47c9fe480d1) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Reconcile drift between CLI help, docs, and code (issue [#181](https://github.com/0pilatos0/bitbucket-cli/issues/181)).
  - `bb auth login --app-password`: clarify that app passwords are deprecated and the flag opts into API token auth.
  - `bb pr list --mine`: tighten help text to say "PRs where you are a reviewer (not authored by you)" so the meaning isn't ambiguous.
  - `bb pr reviewers add` / `remove`: rename the positional from `<username>` to `<user>`, document that it accepts an account ID or `{uuid}`, and update examples (Bitbucket Cloud no longer accepts the legacy login name).
  - `bb snippet create --file` / `bb snippet edit --file`: note in help that the flag is variadic and can be repeated.
  - Docs: add the auto-managed `lastVersionCheck` config key to the configuration reference and include `default-reviewers` in the `bb repo <Tab>` completion example.

## 1.15.0

### Minor Changes

- [#214](https://github.com/0pilatos0/bitbucket-cli/pull/214) [`8395a68`](https://github.com/0pilatos0/bitbucket-cli/commit/8395a68b22c01a4c69063268ffaf2b6295b14e55) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Make error messages actionable with next-step guidance: auth errors mention both `bb auth login` and the `BB_USERNAME`/`BB_API_TOKEN` env vars; `CONTEXT_REPO_NOT_FOUND` distinguishes between not being in a git repo, missing remote, and non-Bitbucket remotes; 404s on `bb pr view`, `bb repo view`, and `bb snippet view` now name the missing resource; network errors point to `DEBUG=true` and proxy/CA troubleshooting; `bb config get` for hidden keys explains why and points at `bb config list`; `bb pr create` validation includes a `--help` footer; `bb auth login` distinguishes invalid credentials from rate limiting; `bb pr comment` lists the three valid mode combinations.

- [#206](https://github.com/0pilatos0/bitbucket-cli/pull/206) [`1b46ea8`](https://github.com/0pilatos0/bitbucket-cli/commit/1b46ea87c4e693bb736ba708da0a61e113367f3c) Thanks [@0pilatos0](https://github.com/0pilatos0)! - feat(errors): add distinguishable error codes for file-not-found and shell completion failures

  Adds three new error codes so JSON-output-driven scripts can branch on the
  specific failure mode instead of treating everything as `VALIDATION_INVALID`
  (5002) or `UNKNOWN` (9999):
  - `FILE_NOT_FOUND` (5003) — used by `bb snippet create/edit --file`,
    `bb snippet view --file`, and `bb pr edit --body-file` when a referenced
    file does not exist on disk or in the snippet
  - `COMPLETION_INSTALL_FAILED` (9001) — `bb completion install` failures
  - `COMPLETION_UNINSTALL_FAILED` (9002) — `bb completion uninstall` failures

  `APIError` now also populates `context` with the failed request method,
  URL and HTTP status, giving scripts structured fields to key on for 404s
  and other API errors.

  The error-code reference docs are updated with the new codes and clarify
  the boundary between `AUTH_INVALID` (1002 — credentials rejected at
  request time) and `AUTH_EXPIRED` (1003 — OAuth token expired _and_ its
  refresh failed).

### Patch Changes

- [#199](https://github.com/0pilatos0/bitbucket-cli/pull/199) [`76e75a0`](https://github.com/0pilatos0/bitbucket-cli/commit/76e75a0f21608dbeb611be80b9c17e0682c1de35) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: anchor `parseRemoteUrl` regex to reject crafted Bitbucket URLs like `git@bitbucket.org:foo/bar.git.attacker.com/x/y`, and redact query strings from request URL DEBUG logs.

- [#210](https://github.com/0pilatos0/bitbucket-cli/pull/210) [`66b1472`](https://github.com/0pilatos0/bitbucket-cli/commit/66b14722523776cecebcfaeb1ff51ffe0ffc6e5d) Thanks [@0pilatos0](https://github.com/0pilatos0)! - docs: improve docs site navigation, cross-linking, and discoverability

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

- [#213](https://github.com/0pilatos0/bitbucket-cli/pull/213) [`a34fdf8`](https://github.com/0pilatos0/bitbucket-cli/commit/a34fdf85a358bf81f7185907f44d705bfcea8fd8) Thanks [@0pilatos0](https://github.com/0pilatos0)! - docs: add Recipes / Cookbook section with five common workflows — auto-merge when CI is green, bulk reviewer assignment, fork synchronization, reporting & analytics jq patterns, and a retry wrapper for transient failures. Closes [#184](https://github.com/0pilatos0/bitbucket-cli/issues/184).

- [#200](https://github.com/0pilatos0/bitbucket-cli/pull/200) [`3ea4760`](https://github.com/0pilatos0/bitbucket-cli/commit/3ea4760810cf0996548eca2e1d6897868f2fd506) Thanks [@0pilatos0](https://github.com/0pilatos0)! - fix(security): use `open` package in `pr diff --web` instead of shell-string `exec`

  Replaces the platform-specific shell command (`open "${url}"`, `start "" "${url}"`,
  `xdg-open "${url}"`) in `pr diff --web` with the already-bundled `open` package, so the
  URL is no longer interpreted by `/bin/sh` or `cmd.exe`. URLs containing shell
  metacharacters (`&`, `` ` ``, `$`, `"`, `|`, `>`) are now passed verbatim to the
  browser instead of being parsed as shell syntax.

- [#204](https://github.com/0pilatos0/bitbucket-cli/pull/204) [`2c2aa88`](https://github.com/0pilatos0/bitbucket-cli/commit/2c2aa8848e4f4c8a1952126e9cf0f1e8df20893a) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: harden config-file integrity
  - Write the config via a unique tmp file with `O_EXCL` (`flag: 'wx'`) and an
    atomic `rename`, so a hostile pre-existing symlink at `config.json` is no
    longer silently followed and a crash mid-write cannot leave a partially
    written config behind.
  - On read, refuse to open `config.json` (or its containing directory) with
    group/world-accessible permissions — the co-tenant scenario where another
    user pre-creates the file with `0o644` before the first login is now
    surfaced as a clear error with the exact `chmod` command to fix it.
  - Create the config directory with mode `0o700` and the config file with
    mode `0o600`.

- [#202](https://github.com/0pilatos0/bitbucket-cli/pull/202) [`3586adb`](https://github.com/0pilatos0/bitbucket-cli/commit/3586adba841ea538e5b5cf34903251db2be143ec) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: harden OAuth callback flow
  - Bind the local OAuth callback server to `127.0.0.1` instead of all
    interfaces so the auth window is not reachable from the LAN.
  - Bump the OAuth `state` parameter from 128 to 256 bits.
  - Add a 10s timeout to every `fetch()` in the OAuth flow (token exchange,
    refresh, revoke, user-info) so a hung Bitbucket endpoint cannot stall
    the CLI indefinitely.
  - Surface token-revocation failures on logout as a warning instead of
    silently dropping them; local credentials are still cleared.

- [#211](https://github.com/0pilatos0/bitbucket-cli/pull/211) [`bfa6339`](https://github.com/0pilatos0/bitbucket-cli/commit/bfa6339c0d2dce8fc54d9294ed7c98a3a0309756) Thanks [@0pilatos0](https://github.com/0pilatos0)! - improve onboarding and first-run experience
  - README install section now leads with a Bun preflight (`bun --version`),
    steps users through Bun + CLI install, and points out
    `bb completion install` for tab completion.
  - README gains a short Environment Variables table covering `BB_USERNAME`,
    `BB_API_TOKEN`, `DEBUG`, `NO_COLOR`, and `FORCE_COLOR`, with a link to the
    full reference.
  - `bb` invoked with no subcommand now appends a one-line tip suggesting
    `bb auth login` when no credentials are configured.
  - `bb auth login --help` now leads with the recommended method (OAuth),
    notes the API-token path for CI, and surfaces the app-password
    deprecation up front.

- [#198](https://github.com/0pilatos0/bitbucket-cli/pull/198) [`71c0767`](https://github.com/0pilatos0/bitbucket-cli/commit/71c0767970074d3febfc64b768ae2157a98d33b2) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: stop persisting the OAuth token-endpoint response body in `BBError.context`. The raw body could include attacker-influenced data when a custom OAuth provider was configured via `--client-id`/`--client-secret`, and surfaced through `--json` error output. The error now exposes only `{ status }` in `context`; if the response is a JSON body with `error_description`, a sanitized, length-capped excerpt is folded into the user-facing `message`.

- [#197](https://github.com/0pilatos0/bitbucket-cli/pull/197) [`cf5390d`](https://github.com/0pilatos0/bitbucket-cli/commit/cf5390db5090a42f30738ecbc50dd1ad0dbe6f47) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: add PKCE (S256) to the OAuth authorization-code flow. The CLI now generates a per-login `code_verifier`, sends `code_challenge` + `code_challenge_method=S256` on the authorize redirect, and supplies the verifier on token exchange. An attacker who intercepts only the authorization code can no longer redeem it.

- [#201](https://github.com/0pilatos0/bitbucket-cli/pull/201) [`fe955aa`](https://github.com/0pilatos0/bitbucket-cli/commit/fe955aa4539a5167d3096e907ad0d0c053eda346) Thanks [@0pilatos0](https://github.com/0pilatos0)! - security: strip ANSI / OSC / control characters from terminal output

  Untrusted strings from the API (PR titles, descriptions, branch names,
  snippet file names, repo descriptions, etc.) are now sanitized before
  being printed by `OutputService`. This blocks terminal-spoofing primitives
  such as OSC-8 hyperlink injection, OSC-0 terminal-title rewrites, and
  CSI cursor / screen-clear sequences. Chalk-generated SGR color codes
  composed by commands continue to render normally. JSON output is
  unchanged.

- [#208](https://github.com/0pilatos0/bitbucket-cli/pull/208) [`3404203`](https://github.com/0pilatos0/bitbucket-cli/commit/3404203516c6b5736767b1ff1734054dd7e76408) Thanks [@0pilatos0](https://github.com/0pilatos0)! - docs(cli): standardize `--help` text coverage across all commands. PR `approve`/`decline`/`ready`/`checkout`, PR `comments edit`/`delete`, PR `reviewers add`/`remove`, snippet `watch`/`unwatch`/`comments delete`/`comments edit`, `auth logout`, and `completion install`/`uninstall` now include multiple realistic examples and (where applicable) `validValues` blocks. `pr merge --strategy` documents the API default. `bb snippet comments add` now also accepts `<message>` as a positional argument for parity with `bb pr comments add`, and its help marks the message as required. A new test guarantees every leaf command exposes an Examples block.

- [#212](https://github.com/0pilatos0/bitbucket-cli/pull/212) [`ff96045`](https://github.com/0pilatos0/bitbucket-cli/commit/ff9604578839e398bdabfd5fbb6c17d19bc93914) Thanks [@0pilatos0](https://github.com/0pilatos0)! - docs: surface `--json <fields>` projection and `--jq` filter throughout README, quickstart, per-command pages, and CLI help

  Adds the `--jq` flag to the README global options, a scripting callout in the
  quickstart, and `--json fields` / `--jq` examples to the highest-traffic command
  pages (`pr list`, `pr view`, `pr create`, `repo list`, `snippet list`). The
  `--jq` description in `bb --help` now includes an inline example, and the
  `reference/json-output.mdx` page gains a before/after shape comparison and three
  additional combined projection + jq patterns.

  No CLI behavior changes — `--json [fields]` and `--jq <expression>` already
  existed; this PR is purely about discoverability.

## 1.14.0

### Minor Changes

- [#176](https://github.com/0pilatos0/bitbucket-cli/pull/176) [`87b68ae`](https://github.com/0pilatos0/bitbucket-cli/commit/87b68ae9c338c84acbed121ffaca67ffa7cadfb8) Thanks [@0pilatos0](https://github.com/0pilatos0)! - feat: add `--json <fields>` projection and `--jq <expression>` filter to JSON output

  Match the `gh` CLI's JSON formatting flags so muscle memory and scripts port over cleanly:
  - `--json [fields]` accepts an optional comma-separated field list (e.g. `--json number,title,author.display_name`). Bare `--json` keeps the existing full-object output for backwards compatibility.
  - `--jq <expression>` runs the JSON output through a [`jq-wasm`](https://www.npmjs.com/package/jq-wasm) embedded jq engine. Requires `--json`.
  - Field projection drops the wrapper around list-style results (e.g. `pullRequests`, `repositories`, `snippets`) and projects per-item, matching `gh` semantics.
  - Dotted paths (`author.display_name`) traverse nested objects.
  - Invalid jq expressions exit non-zero with the underlying jq error.

  Examples:

  ```bash
  bb pr list --json number,title,state
  bb pr list --json author --jq '.[].author.display_name'
  bb pr list --json number,title,state --jq '.[] | select(.state == "OPEN") | .title'
  ```

## 1.13.2

### Patch Changes

- [#169](https://github.com/0pilatos0/bitbucket-cli/pull/169) [`e359340`](https://github.com/0pilatos0/bitbucket-cli/commit/e35934022a4ff7b27a65f6f78e5b04a8bd74d602) Thanks [@0pilatos0](https://github.com/0pilatos0)! - ci: harden workflows and unblock Windows contributors

  Pins Bun and every GitHub Action to explicit versions/SHAs, caches the Bun install directory, adds cancel-in-progress for PR runs, and drops the `grep "0 fail"` hack that could mask real test output. Release no longer tags or publishes until lint, format, and tests all pass, and stops swallowing GitHub Packages publish failures. CI now runs the full test + build on ubuntu, macos, and windows.

  Surface fix while adding the matrix: `ConfigService.getConfigPath()` now uses `posix.join` on simulated non-Windows platforms so path resolution is correct when developers run the tests on Windows.

- [`afa554e`](https://github.com/0pilatos0/bitbucket-cli/commit/afa554e2e2f849aa7475cb0feba57b018523618d) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(cli): extract PR states constant and collapse completion if/else into a map

  Internal-only change — no user-facing behavior change.
  - **`PR_STATES` constant**: The literal list `['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']` was written out three times — once in `pr/list.command.ts` as the option validator, once in `cli.ts` as the `--state` description, and once in the help text's `Valid states`. Lifted to a new `src/types/pr.ts` export so future additions only touch one place.
  - **Tabtab completion**: The `env.prev` dispatch in `cli.ts` was an eight-branch if/else chain hand-maintained next to Commander's command tree. Replaced with a single `ReadonlyMap<parent, subcommands>` table, keeping the special-case `comments` disambiguation (its parent can be `pr` or `snippet`) separate. Same completions, fewer branches to keep in sync.

- [#168](https://github.com/0pilatos0/bitbucket-cli/pull/168) [`9d1122b`](https://github.com/0pilatos0/bitbucket-cli/commit/9d1122b3ae205d96158bb52d56f6457cd9d277e1) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(context): consolidate workspace resolution onto `ContextService`

  Internal cleanup — no behavior change. The standalone `resolveWorkspace()` helper is folded into `IContextService.requireWorkspace()`, so every command that needs workspace-or-repo context now depends on the same service. Snippet and workspace-only repo commands (`repo list` / `repo create` / `repo clone`) are migrated to inject `ContextService` instead of `ConfigService`, and `src/services/workspace-resolver.ts` is removed. Resolves [#146](https://github.com/0pilatos0/bitbucket-cli/issues/146).

- [`7da1646`](https://github.com/0pilatos0/bitbucket-cli/commit/7da1646c1aee8d6503ed2625d18a75688077faca) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(context): drop pointless `new RegExp(/literal/)` wrapping in remote URL parser

  Internal-only change — no behavior change. `ContextService.parseRemoteUrl` constructed its SSH and HTTPS regexes as `new RegExp(/.../).exec(url)`, which wraps an already-compiled regex literal in a second `RegExp` constructor call. Replaced with direct `/regex/.exec(url)` calls.

- [`b525659`](https://github.com/0pilatos0/bitbucket-cli/commit/b5256594b2114e3bd46948db00846b6efc5a7a1a) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(services): drop duplicate types and unnecessary casts

  Internal-only change — no user-facing behavior change. Three small cleanups in `src/services/`:
  - `reviewer.service.ts` redefined its own `RepoContext` interface identical to the canonical one in `src/types/config.ts`. Removed the duplicate and imported the shared type.
  - `extractReviewerUuids` and `buildReviewersUpdateBody` were re-exported from `src/services/index.ts` but only consumed inside `reviewer.service.ts` itself (and the colocated tests, which already import from the module directly). Narrowed the barrel to just `updatePullRequestReviewers`.
  - `coerceVersionCheckIntervalValue(intervalDays as unknown)` in `version.service.ts` cast the argument to `unknown` unnecessarily — the coerce function accepts `unknown` already, and `IConfigService.getValue` returns a typed value.

- [#160](https://github.com/0pilatos0/bitbucket-cli/pull/160) [`20cc179`](https://github.com/0pilatos0/bitbucket-cli/commit/20cc1792145b35d48478251d7a9c9340e0aa8795) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Housekeeping bundle ([#150](https://github.com/0pilatos0/bitbucket-cli/issues/150)):
  - Document why the OAuth default client credentials shipped in the CLI are not a secret leak, so future readers don't rotate them thinking they were exposed.
  - Add a `.npmignore` as belt-and-suspenders alongside the existing `files` whitelist in `package.json`.
  - Replace the fragile substring check that disambiguated `bb snippet comments` from `bb pr comments` during tab completion with a tokenized parent-command lookup. Also enables `list / add / edit / delete` completions for `bb pr comments <TAB>`, which previously offered none.

- [#166](https://github.com/0pilatos0/bitbucket-cli/pull/166) [`d2ffe97`](https://github.com/0pilatos0/bitbucket-cli/commit/d2ffe97b02d1997b0f8f10dd2c6f9ec8ebd0aaa2) Thanks [@0pilatos0](https://github.com/0pilatos0)! - fix(pagination): reject `--limit 0` and other non-positive values instead of silently returning no results

  `parseLimit` previously fell back to the default limit when given `0`, a negative number, or a non-numeric string — except for `collectPages`, which honored `0` by returning an empty array. A user passing `--limit 0` got zero results with no feedback. `parseLimit` now throws a `VALIDATION_INVALID` `BBError` (`--limit must be a positive integer`) for any explicit non-positive or non-finite value. A missing option still returns the fallback. Adds a dedicated `tests/services/pagination.test.ts` covering `parseLimit` and `collectPages`. Resolves [#145](https://github.com/0pilatos0/bitbucket-cli/issues/145).

- [#162](https://github.com/0pilatos0/bitbucket-cli/pull/162) [`a078adc`](https://github.com/0pilatos0/bitbucket-cli/commit/a078adc0b8bc579aeac1cebec03db3e50cfbcb3e) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(bootstrap): collapse DI registrations behind `registerApiClient` and `registerCommand` helpers

  Internal cleanup — no behavior change. `bootstrap.ts` shrinks from ~874 to ~591 lines by extracting two local helpers:
  - `registerApiClient(container, token, ctor)` for generated OpenAPI clients (ConfigService + OAuthService + axios wiring).
  - `registerCommand(container, token, ctor, deps)` for the ~40 commands (and simple services) whose factory is just `resolve → resolve → new Cmd(...)`.

  Adding a new command is now a 3–8 line registration instead of a ~10 line boilerplate block. Resolves [#147](https://github.com/0pilatos0/bitbucket-cli/issues/147).

- [`0ed48dd`](https://github.com/0pilatos0/bitbucket-cli/commit/0ed48dd0d13cfa0a21ce783f0cab5656686adc9c) Thanks [@0pilatos0](https://github.com/0pilatos0)! - fix(snippet): replace `as unknown as` casts in snippet comment commands with real types

  Internal-only change — no user-facing behavior change. The generated `SnippetComment` extends `ModelObject` which carries an `[key: string]: any` index signature, so the surrounding `as unknown as SnippetComment` / `as unknown as Record<string, unknown>` casts in `comments.add`, `comments.edit`, and `comments.list` were load-bearing only because nobody had tried the direct typing. Constructing the request bodies as `SnippetComment` directly and reading response fields without the intermediate record cast keeps the same runtime behaviour while narrowing the places TypeScript is told to look the other way.

- [#167](https://github.com/0pilatos0/bitbucket-cli/pull/167) [`d99b276`](https://github.com/0pilatos0/bitbucket-cli/commit/d99b2768fcb5788c812625ae6212ace3d0470fbb) Thanks [@0pilatos0](https://github.com/0pilatos0)! - refactor(config): split `IConfigService` into `IConfigService` + `ICredentialStore`

  Internal-only change — no user-facing behavior or on-disk format changes. The old `IConfigService` mixed three concerns (app config, basic auth credentials, OAuth token state), forcing every consumer and test mock to depend on the full surface even when they only needed one piece.
  - `IConfigService` now covers app config only: `getConfig`, `getValue`, `setValue`, `getConfigPath`, `clearConfig`.
  - New `ICredentialStore` covers basic + OAuth credentials: `getAuthMethod`, `get/set/clearCredentials`, `get/set/clearOAuthCredentials`, `isOAuthTokenExpired`.
  - `ConfigService` keeps implementing both, so the same JSON file backs both interfaces. A `ServiceTokens.CredentialStore` registration is added as an alias resolving the same singleton, leaving an opening for a future alternative store (e.g. OS keychain) without touching non-auth consumers.
  - Commands and services now inject the narrower dependency they actually use. Test mocks gain `createMockConfigServiceOnly` and `createMockCredentialStoreOnly` factories for tests that only exercise one surface.

  Resolves [#148](https://github.com/0pilatos0/bitbucket-cli/issues/148).

- [#161](https://github.com/0pilatos0/bitbucket-cli/pull/161) [`14f768c`](https://github.com/0pilatos0/bitbucket-cli/commit/14f768c7cca5005173b5ae6dea53e2739bc13a7c) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Test infrastructure cleanup ([#149](https://github.com/0pilatos0/bitbucket-cli/issues/149)):
  - Centralize the OAuth-capable mock config service in `tests/setup.ts`; `tests/services/api-client.test.ts` now reuses `createMockConfigService` instead of rolling its own duplicate factories.
  - Track temp dirs created by `tests/services/snippet-files.service.test.ts` and remove them in `afterEach` so `bb-snippet-*` dirs no longer accumulate under `$TMPDIR` across test runs.

- [#165](https://github.com/0pilatos0/bitbucket-cli/pull/165) [`8170770`](https://github.com/0pilatos0/bitbucket-cli/commit/8170770004d69d50410776cc9327380ef3f32725) Thanks [@0pilatos0](https://github.com/0pilatos0)! - chore(tsconfig): tighten type-checking for TypeScript 6
  - Enable `verbatimModuleSyntax`, `isolatedModules`, and `noUncheckedIndexedAccess` for stricter, Bun-aligned type-checking.
  - Replace legacy `bun-types` entry with `bun` (matches the `@types/bun` dependency).
  - Drop `declaration`, `outDir`, and `rootDir` — no-ops under `noEmit: true`, since builds go through `bun build`.

  No runtime behavior change. A handful of internal `string | undefined` sites from regex captures and guaranteed-index array access were narrowed with non-null assertions.

- [#164](https://github.com/0pilatos0/bitbucket-cli/pull/164) [`73e2b24`](https://github.com/0pilatos0/bitbucket-cli/commit/73e2b2433d33f170fee63e75c5fb797d894bb7fd) Thanks [@0pilatos0](https://github.com/0pilatos0)! - chore(deps): upgrade dependencies
  - `axios` 1.13.2 → 1.15.0
  - `commander` 14.0.2 → 14.0.3
  - `@changesets/cli` 2.29.8 → 2.31.0
  - `@changesets/changelog-github` 0.5.2 → 0.6.0
  - `@openapitools/openapi-generator-cli` 2.28.0 → 2.31.1
  - `@types/bun` 1.3.5 → 1.3.12
  - `@types/node` 25.1.0 → 25.6.0
  - `prettier` 3.8.1 → 3.8.3
  - `typescript` 5.9.3 → 6.0.3

  TypeScript 6 migration verified: project already uses `moduleResolution: bundler`, strict mode, and ESM — none of the removed legacy flags or the dropped `node` resolution are in use. `tsc --noEmit`, full test suite (788 tests), and `bun build` all pass.

## 1.13.1

### Patch Changes

- [`071fb12`](https://github.com/0pilatos0/bitbucket-cli/commit/071fb12b248d82dccd10a19972f122f47df031b8) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Refresh the generated Bitbucket Cloud API client from the latest spec. Adds a post-generation patch script that dedupes duplicate enum declarations and corrects `PipelineSelector.type` optionality so the generated output type-checks. Call-site adjustments only (no user-facing behavior change): the renamed OpenAPI request-body parameters (`body` → `pullrequest` / `pullrequestComment` / `pullrequestMergeParameters` / `repository` / `snippetComment`) are now used, and `Participant.state`'s new nullable type is coerced where consumed.

## 1.13.0

### Minor Changes

- [`07ff5ac`](https://github.com/0pilatos0/bitbucket-cli/commit/07ff5ac0ca025b571a84995aaf5c10f60880d9ce) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add support for Bitbucket Default Reviewers (closes #139).
  - New `bb repo default-reviewers list|add|remove` commands to inspect and manage the default reviewers of a repository. `list` shows the effective set (repo-level plus project-inherited) by default; pass `--direct` for only repo-level entries. `remove` requires `--yes` to confirm.
  - `bb pr create` gains opt-in support for default reviewers:
    - `--default-reviewers` fetches and attaches the repository's effective default reviewers (matching the web UI behavior).
    - `--reviewer <username>` (repeatable) adds explicit reviewers independent of the defaults.
    - `--no-default-reviewers` skips defaults when the config key enables them.
    - The PR author is automatically excluded from the reviewer list.
  - New config key `prCreateIncludeDefaultReviewers` (boolean, default `false`) makes `--default-reviewers` the default behavior on `bb pr create`.

### Patch Changes

- [#156](https://github.com/0pilatos0/bitbucket-cli/pull/156) [`14e75c6`](https://github.com/0pilatos0/bitbucket-cli/commit/14e75c6af262ff1a70fe8eb095d942ec083d7abf) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Harden PR commands:
  - `bb pr view`, `bb pr activity`, `bb pr merge`, and `bb pr checks` now validate `<id>` as an integer and fail fast with a clear `--id must be a valid integer` error instead of silently passing `NaN` to the Bitbucket API.
  - `bb pr activity --type` now rejects unknown activity types (e.g. `--type commetn`) with a `--type must be one of: …` error instead of silently returning zero results.
  - Removed the redundant local `--json` flag on `bb pr checks`; use the global `--json` option instead.

- [#152](https://github.com/0pilatos0/bitbucket-cli/pull/152) [`153f05d`](https://github.com/0pilatos0/bitbucket-cli/commit/153f05d9513e2c8bdbaf92b8b7a6485b612ddea8) Thanks [@0pilatos0](https://github.com/0pilatos0)! - `bb pr comments delete` now requires `--yes` to confirm deletion, matching the guardrail on other destructive commands (`bb repo delete`, `bb snippet delete`, `bb snippet comments delete`).

- [#153](https://github.com/0pilatos0/bitbucket-cli/pull/153) [`15373c5`](https://github.com/0pilatos0/bitbucket-cli/commit/15373c50dd806c0f314f5191a9edf665cc2ba412) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Redact `access_token`, `refresh_token`, and other token-bearing fields from `DEBUG=true` HTTP response logs so OAuth secrets no longer leak into terminal output or CI logs when debugging.

- [#155](https://github.com/0pilatos0/bitbucket-cli/pull/155) [`6a1d1e2`](https://github.com/0pilatos0/bitbucket-cli/commit/6a1d1e28a2b05d07928443d18479ea4496bf5913) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Validate `bb pr merge --strategy` locally against the allowed merge strategies (`merge_commit`, `squash`, `fast_forward`, `squash_fast_forward`, `rebase_fast_forward`, `rebase_merge`). Invalid values now fail fast with a helpful `--strategy must be one of: …` message instead of surfacing as an opaque Bitbucket API error.

## 1.12.0

### Minor Changes

- [#135](https://github.com/0pilatos0/bitbucket-cli/pull/135) [`43481c1`](https://github.com/0pilatos0/bitbucket-cli/commit/43481c10c4ff864b2895577a2ef3daa5e122a16b) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add snippet command group with full CRUD support for Bitbucket snippets.

  New commands:
  - `bb snippet list` — list workspace snippets, optional `--role` filter (`owner`, `contributor`, `member`)
  - `bb snippet view <id>` — view snippet details; `--file <name>` prints one file, `--files` prints all
  - `bb snippet create` — create snippets via `multipart/form-data`, uploading one or more `--file` arguments as the snippet body
  - `bb snippet edit <id>` — update title/visibility (JSON PUT) or replace/add files (multipart PUT) via `--file`
  - `bb snippet delete <id>` — delete snippets (requires `--yes`)
  - `bb snippet watch <id>` / `bb snippet unwatch <id>` — manage snippet watching
  - `bb snippet comments list | add | edit | delete` — full comments CRUD

  All commands support `--json` output and workspace resolution via `--workspace` or the `defaultWorkspace` config key.

  Internal refactor: a shared `resolveWorkspace()` helper now backs every
  workspace-scoped command (snippet + `repo list` / `repo create` / `repo clone`), removing several copies of the same fallback logic.

## 1.11.1

### Patch Changes

- [#137](https://github.com/0pilatos0/bitbucket-cli/pull/137) [`ef9a3c9`](https://github.com/0pilatos0/bitbucket-cli/commit/ef9a3c92010266b1a182ec0772423a0657a854c1) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix documentation inaccuracies, remove bloat, and improve clarity across docs site
  - Fix hardcoded version 1.4.0 in Head.astro structured data (now reads from package.json)
  - Remove stale meta keywords tag (ignored by search engines since 2009)
  - Add missing `lastVersionCheck` config key to reference docs
  - Fix incorrect API token scope names in CI/CD and AI agents guides
  - Add warning about misleading `--app-password` flag name in auth docs
  - Add prominent caution about `--mine` filtering by reviewer, not author
  - Clarify Bun runtime requirement in README (installed via npm, runs on Bun)
  - Document built-in retry logic (3x exponential backoff on 429/502/503/504)
  - Document automatic OAuth token refresh behavior
  - Improve DEBUG environment variable description
  - Fix `repo delete --yes` docs (not an interactive prompt, flag is required)
  - Remove generic "Team Conventions" section from AI agents guide
  - Trim scripting guide (remove 2 complex examples and Python/Node.js sections)
  - Replace padding GitHub vs Bitbucket CLI comparison table in FAQ
  - Update stale version numbers in example notification output

## 1.11.0

### Minor Changes

- [`71ac4b0`](https://github.com/0pilatos0/bitbucket-cli/commit/71ac4b0e204aca4f9ff2cb5517a40fbb573dd4ef) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add OAuth 2.0 authentication support
  - `bb auth login` now opens the browser for OAuth authorization by default
  - API token auth remains available via `bb auth login -u <user> -p <token>` or `--app-password`
  - OAuth tokens refresh automatically when expired
  - Custom OAuth consumers supported via `--client-id` and `--client-secret`
  - `bb auth status` shows authentication method and token expiry
  - `bb auth logout` revokes OAuth tokens server-side
  - `bb auth token` outputs the active bearer or basic token

## 1.10.1

### Patch Changes

- [#133](https://github.com/0pilatos0/bitbucket-cli/pull/133) [`b1a1d7a`](https://github.com/0pilatos0/bitbucket-cli/commit/b1a1d7a064e4508363cec6214919344486a7d937) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Remove unsafe `as unknown as` type casts in reviewer add/remove commands and extract shared reviewer update logic into a reusable service

## 1.10.0

### Minor Changes

- [#131](https://github.com/0pilatos0/bitbucket-cli/pull/131) [`ada0739`](https://github.com/0pilatos0/bitbucket-cli/commit/ada0739fc28c9d2115dff69cdcfe47a621a5ee64) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add automatic retry with exponential backoff for rate-limited (429) and transient server errors (502/503/504)

### Patch Changes

- [#130](https://github.com/0pilatos0/bitbucket-cli/pull/130) [`ddea45e`](https://github.com/0pilatos0/bitbucket-cli/commit/ddea45e3fe072ccd6448ee374fa7d81d00ba9da0) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix silent error swallowing in runCommand: ensure process.exitCode is always set on failure and log container resolution errors

## 1.9.1

### Patch Changes

- [#124](https://github.com/0pilatos0/bitbucket-cli/pull/124) [`322ef55`](https://github.com/0pilatos0/bitbucket-cli/commit/322ef55ce4b03c1dfbc3d8609ad21a4a052d1cec) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Expand test coverage for delete/edit comment and reviewer list/add/remove commands

- [#123](https://github.com/0pilatos0/bitbucket-cli/pull/123) [`f73e86e`](https://github.com/0pilatos0/bitbucket-cli/commit/f73e86e9976bce8ed3137151d496a1d0f26b31bb) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Strengthen option validation: add NaN checks for numeric IDs in 6 PR subcommands, validate --state enum in list command, and require --name in repo create command

## 1.9.0

### Minor Changes

- [#94](https://github.com/0pilatos0/bitbucket-cli/pull/94) [`db2af3f`](https://github.com/0pilatos0/bitbucket-cli/commit/db2af3ffe41baacc888644a0b6e432a91b0d5948) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add a `--mine` flag to `bb pr list` so you can filter pull requests where the
  authenticated user is assigned as a reviewer.

### Patch Changes

- [`322b99f`](https://github.com/0pilatos0/bitbucket-cli/commit/322b99f0ec3f41ebe5ecba2cf1a23fe1bff2f87b) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Comprehensive documentation fixes: correct merge strategies (all 6 now listed),
  fix broken jq examples in CI/CD and scripting guides, add missing DEBUG env var,
  enumerate activity type filter values, expand FAQ feature list, restructure JSON
  output reference around 5 output patterns, standardize auth scope naming, add
  macOS date fallbacks, fix error handling redirects, clarify --mine reviewer
  filtering, and align config output format across pages.

- [`2f5dd89`](https://github.com/0pilatos0/bitbucket-cli/commit/2f5dd891c71894afd1509021cb85bfe4e0026bc3) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Rewrite AI agent integration guide: add copy-paste quick start for Claude Code,
  opencode, Cursor, and Windsurf; modernize skill file with dynamic context
  injection and proper frontmatter; add realistic multi-step workflow examples,
  token scope reference, security guidance, and expanded troubleshooting.

## 1.8.4

### Patch Changes

- [`f59f846`](https://github.com/0pilatos0/bitbucket-cli/commit/f59f846b6dbb2ac0a9f0a005fc094134c8a0d422) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add color support to CLI help text with bold headers, dim examples, and cyan values. Respects --no-color flag and NO_COLOR environment variable.

- [`eb1e5cb`](https://github.com/0pilatos0/bitbucket-cli/commit/eb1e5cbddd99577008b7cf998ed290202284a7ca) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add usage examples, valid option values, defaults, and environment variable
  documentation to all CLI command help text.

## 1.8.3

### Patch Changes

- [#117](https://github.com/0pilatos0/bitbucket-cli/pull/117) [`c3d7e63`](https://github.com/0pilatos0/bitbucket-cli/commit/c3d7e63a6a8e0b91de71948045a484882c3001d7) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Refine API response parsing by adding shared typed helpers for links,
  diffstats, and pull request activity payloads. This removes command-level
  `any` casts in PR/repo commands and adds focused tests for the new parsers.

## 1.8.2

### Patch Changes

- [#115](https://github.com/0pilatos0/bitbucket-cli/pull/115) [`436a6ee`](https://github.com/0pilatos0/bitbucket-cli/commit/436a6eeb60459f0956aae5dc319d4659b206963d) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix `bb completion install` path errors in published builds by externalizing
  `tabtab` during bundling so shell script templates are resolved from runtime
  `node_modules` instead of CI-only absolute paths.

## 1.8.1

### Patch Changes

- [#112](https://github.com/0pilatos0/bitbucket-cli/pull/112) [`3022e04`](https://github.com/0pilatos0/bitbucket-cli/commit/3022e04346bde4d01bbd9195a4b1aad7b93aa9f0) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Emit structured JSON errors to stderr when `--json` is enabled, including typed error codes for command validation and config failures. This makes scripting more reliable while preserving non-zero exits and existing human-readable error output in non-JSON mode.

- [#107](https://github.com/0pilatos0/bitbucket-cli/pull/107) [`4cb0e33`](https://github.com/0pilatos0/bitbucket-cli/commit/4cb0e33456af3387e60121885c73af3bbfeba460) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Resolve the `-w` short-flag collision in `bb pr diff` by making `--web`
  long-form only, keeping `-w` consistently reserved for global
  `--workspace`.

- [#110](https://github.com/0pilatos0/bitbucket-cli/pull/110) [`f995668`](https://github.com/0pilatos0/bitbucket-cli/commit/f995668d1720990fa972ccf358c6b4245f0f0843) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix `bb pr diff --web --json` to return a Bitbucket web diff URL instead of
  an API endpoint URL.

- [#106](https://github.com/0pilatos0/bitbucket-cli/pull/106) [`dafd375`](https://github.com/0pilatos0/bitbucket-cli/commit/dafd375496d67ca8cc5d2c7587220d46785dbc7b) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix `bb auth logout` and failed `bb auth login` cleanup to remove only
  authentication fields (`username` and `apiToken`) while preserving other
  configuration values.

- [#108](https://github.com/0pilatos0/bitbucket-cli/pull/108) [`30c1b10`](https://github.com/0pilatos0/bitbucket-cli/commit/30c1b10512fff4fdc468d445bfa40c9d94e039e3) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix Windows config path resolution to store `config.json` in `%APPDATA%\bb` by default, with a home-directory fallback when `APPDATA` is unavailable. This aligns runtime behavior with the documentation.

- [#113](https://github.com/0pilatos0/bitbucket-cli/pull/113) [`63bba51`](https://github.com/0pilatos0/bitbucket-cli/commit/63bba51e0235a9a203ff679c6e1303ff6ee8e407) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Honor `--limit` across paginated PR and repository list commands, including PR activity and PR comments. Also improve `bb pr diff` and `bb pr edit` auto-detection so they can find matching pull requests across multiple pages.

## 1.8.0

### Minor Changes

- [#105](https://github.com/0pilatos0/bitbucket-cli/pull/105) [`1ea1993`](https://github.com/0pilatos0/bitbucket-cli/commit/1ea199385a2452b32f5a21bd73578c4f2dcb4fa0) Thanks [@AlexSuprun](https://github.com/AlexSuprun)! - Add inline comment support to `bb pr comments add` with `--file`, `--line-to`, and `--line-from` flags

### Patch Changes

- [#103](https://github.com/0pilatos0/bitbucket-cli/pull/103) [`c8b804f`](https://github.com/0pilatos0/bitbucket-cli/commit/c8b804f51d8c42ef4e196e5a1824c90fbb1807a2) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix `bb config set` to parse and validate typed configuration values so
  `skipVersionCheck` and `versionCheckInterval` are stored and returned as boolean
  and number values. Add backward-compatible handling for legacy string values in
  version checks and document typed config behavior.

## 1.7.1

### Patch Changes

- [`77149d5`](https://github.com/0pilatos0/bitbucket-cli/commit/77149d553a3571d26594f712a06a784299e25f50) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix release publishing CI by wiring npm authentication for the reusable publish workflow and manual publish runs.

## 1.7.0

### Minor Changes

- [#93](https://github.com/0pilatos0/bitbucket-cli/pull/93) [`4180b37`](https://github.com/0pilatos0/bitbucket-cli/commit/4180b37b739d59c9cb4572d6c4d6e12f446d98c0) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Normalize CLI output behavior by adding global JSON support to all commands,
  introducing global `--no-color` handling, and routing command formatting through
  `IOutputService` helpers instead of direct `chalk` usage.

### Patch Changes

- [#90](https://github.com/0pilatos0/bitbucket-cli/pull/90) [`11d8300`](https://github.com/0pilatos0/bitbucket-cli/commit/11d8300d9a0bdbd7ef44fc98a47aca96ab596628) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Centralize CLI command execution and error handling.

- [#88](https://github.com/0pilatos0/bitbucket-cli/pull/88) [`c175766`](https://github.com/0pilatos0/bitbucket-cli/commit/c175766ab07c798ff87a648982508a28fb68d1f9) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Remove unused legacy modules and consolidate helpers.

## 1.6.0

### Minor Changes

- [#77](https://github.com/0pilatos0/bitbucket-cli/pull/77) [`ac2ee09`](https://github.com/0pilatos0/bitbucket-cli/commit/ac2ee0915052ffd5531c95929b17f0ab1696f683) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add a pull request checks command to show CI/CD status.

## 1.5.0

### Minor Changes

- [#75](https://github.com/0pilatos0/bitbucket-cli/pull/75) [`e54847f`](https://github.com/0pilatos0/bitbucket-cli/commit/e54847f2a3ec1bb5514e334359e04d8881f51c54) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Migrate to generated axios API client

  This is a significant internal refactoring that migrates the CLI from manual API types to a fully generated axios-based API client:

  **Changes:**
  - Switch OpenAPI generator from `typescript-fetch` to `typescript-axios`
  - Generate API client from Bitbucket OpenAPI spec (54,302 lines of generated code)
  - Remove manual type definitions (`src/types/api.ts`)
  - Remove Result pattern and replace with standard Promises
  - Delete repository layer (`src/repositories/`)
  - Delete custom HTTP client (`src/services/http.client.ts`)
  - Update all 32+ commands to use generated APIs
  - Fix all TypeScript errors (0 errors)
  - Update all 298 tests to work with new architecture
  - Update documentation (CONTRIBUTING.md, AGENTS.md)

  **Technical Details:**
  - Collections returned as `Set<T>` are converted to arrays using `Array.from()`
  - API request bodies include required `type` fields
  - Uses axios interceptors for authentication and error handling
  - All services now use standard Promise-based error handling

  Closes #53

## 1.2.0

### Minor Changes

- [#70](https://github.com/0pilatos0/bitbucket-cli/pull/70) [`4690ea8`](https://github.com/0pilatos0/bitbucket-cli/commit/4690ea81c95ea0bf0a6ac039a3d95be445fb0bd0) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add --no-truncate option to `bb pr comments list` command to show full comment content without truncation

- [#73](https://github.com/0pilatos0/bitbucket-cli/pull/73) [`f06609b`](https://github.com/0pilatos0/bitbucket-cli/commit/f06609b1e174c45c6010d2d46ae0bc119ebb6f76) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add automatic update notifications that check npm registry for new versions when running the bare `bb` command. Includes configurable options to disable notifications or change check frequency.

### Patch Changes

- [#74](https://github.com/0pilatos0/bitbucket-cli/pull/74) [`ad919f0`](https://github.com/0pilatos0/bitbucket-cli/commit/ad919f03396397daa1be8bc513d4b281f85432fe) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix Starlight social config format in documentation site. Changed from array format to object format to match newer Starlight version requirements.

## 1.4.0

### Minor Changes

- [#61](https://github.com/0pilatos0/bitbucket-cli/pull/61) [`b17b3fe`](https://github.com/0pilatos0/bitbucket-cli/commit/b17b3fe77e592fdae7f5f43274cb619a2f625c2b) Thanks [@John](https://github.com/John)! - Enhance `bb pr view` command with additional PR metadata

  The `bb pr view` command now displays more comprehensive pull request information:
  - **Closer/Merger information**: Shows who closed or merged the PR (when not OPEN)
  - **Merge commit hash**: Displays the merge commit for merged PRs
  - **Close source branch indicator**: Shows whether the source branch will be closed on merge
  - **Commit hashes**: Shows source and destination commit SHAs
  - **Improved reviewer states**: Now distinguishes between "approved", "changes_requested", and "pending"
  - **Visual improvements**: Added separators and colorized branch names for better readability

  Example output:

  ```
  #42 Fix login authentication [OPEN]
  ────────────────────────────────────────────────────────────
  Branch:   feature/fix-auth → main
  Commits:  a1b2c3d → e4f5g6h
   Doe
  Close Src: ✓ (close source branch on merge)
  Activity: 5 comments · 2 tasks

  Reviewers:
    ✓ Alice Smith approved
    ✗ Bob Johnson changes requested
    ○ Carol White pending
  ```

- [#67](https://github.com/0pilatos0/bitbucket-cli/pull/67) [`03edd17`](https://github.com/0pilatos0/bitbucket-cli/commit/03edd17750d3abd4e15dea6ffaa9f30f903c609e) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add PR Reviewers Management commands

  New commands for managing reviewers on pull requests to enable reviewer assignment and management from CLI:
  - **`bb pr reviewers add <id> <username>`** - Add a reviewer to a pull request by username
  - **`bb pr reviewers remove <id> <username>`** - Remove a reviewer from a pull request by username
  - **`bb pr reviewers list <id>`** - List all reviewers on a pull request

  Example usage:

  ```bash
  # Add a reviewer to PR #123
  bb pr reviewers add 123 johndoe

  # Remove a reviewer from PR #123
  bb pr reviewers remove 123 johndoe

  # List all reviewers on PR #123
  bb pr reviewers list 123
  ```

  Features:
  - Supports `--json` flag for programmatic consumption
  - Automatically looks up user UUID from username via `/users/{username}` endpoint
  - Uses UUID for all reviewer comparisons (not deprecated username field)
  - Displays reviewers in a formatted table (display name and account ID)
  - Shows helpful message when no reviewers are assigned

  Note: Due to Bitbucket Cloud GDPR changes, the `username` field is deprecated. The commands use UUID for identification and display `account_id` in list output.

### Patch Changes

- [#63](https://github.com/0pilatos0/bitbucket-cli/pull/63) [`a5c96e8`](https://github.com/0pilatos0/bitbucket-cli/commit/a5c96e8e85839ace0544b23844df456b931dafaa) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add Bun runtime check and update documentation
  - Added runtime check in `src/index.ts` to provide clear error message when CLI is run with Node.js instead of Bun
  - Updated `package.json` engines field from `node: ">=20"` to `bun: ">=1.0"`
  - Updated all documentation to clarify that Bun runtime is required to execute the CLI
  - Updated CI/CD examples to use Bun images and installation steps
  - Updated troubleshooting guide to check `bun --version` instead of `node --version`

- [#65](https://github.com/0pilatos0/bitbucket-cli/pull/65) [`6e54f6b`](https://github.com/0pilatos0/bitbucket-cli/commit/6e54f6b544793aeadd945a29b21a34f21d5cb526) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix PR comments list showing "Unknown" author and empty content for deleted comments
  - Fixed author field mapping: API returns user data under `user` field (not `author`), and uses `nickname` instead of `username`
  - Deleted comments now display "[deleted]" instead of blank content

## 1.3.1

### Patch Changes

- [#58](https://github.com/0pilatos0/bitbucket-cli/pull/58) [`923089b`](https://github.com/0pilatos0/bitbucket-cli/commit/923089b92c6d30941449a3f593df8558f4efce1d) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Update dependencies for CLI and docs tooling.

## 1.3.0

### Minor Changes

- [#56](https://github.com/0pilatos0/bitbucket-cli/pull/56) [`b3a9593`](https://github.com/0pilatos0/bitbucket-cli/commit/b3a95931cde1b682dd8cf0ae2343389be548dcb1) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add pull request activity command for history tracking.

- [#54](https://github.com/0pilatos0/bitbucket-cli/pull/54) [`6399250`](https://github.com/0pilatos0/bitbucket-cli/commit/6399250339d00bd83d0ea09b10fbdb407f6ff8a5) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add draft pull request support, including a ready command and draft indicators.

## 1.2.0

### Minor Changes

- [#52](https://github.com/0pilatos0/bitbucket-cli/pull/52) [`5e66281`](https://github.com/0pilatos0/bitbucket-cli/commit/5e66281d9f94b61d53f399084aa02e9a4aaab05e) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add PR comments management feature (issue #44)

  Implemented commands:
  - `bb pr comments list <id>` - List comments on a PR
  - `bb pr comments add <id> <message>` - Add a comment to a PR
  - `bb pr comments edit <comment-id> <message>` - Edit a comment
  - `bb pr comments delete <comment-id>` - Delete a comment

### Patch Changes

- [#38](https://github.com/0pilatos0/bitbucket-cli/pull/38) [`58ce559`](https://github.com/0pilatos0/bitbucket-cli/commit/58ce559b93d93e2ddac5dcae4622b28f40775d55) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add AI Agent Integration guide for Claude Code

  New documentation at `/guides/ai-agents/` that helps users set up a Claude Code skill for the Bitbucket CLI. The guide includes:
  - Complete, copy-paste ready skill file
  - Explanation of how skills work (frontmatter, allowed-tools, instructions)
  - Example conversations showing natural language interactions
  - Customization tips for encoding team conventions
  - Troubleshooting section for common issues

- [#50](https://github.com/0pilatos0/bitbucket-cli/pull/50) [`7f1458a`](https://github.com/0pilatos0/bitbucket-cli/commit/7f1458a1c979a8dfb742603ce53c2b7b9dd6d452) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix approve/decline PR commands failing with Bad Request error

  Bug fix for issue #41:
  - Fixed `approve()` method to send empty JSON object `{}` as request body
  - Fixed `decline()` method to send empty JSON object `{}` as request body
  - Enhanced mock HTTP client to capture and verify request bodies in tests
  - Added tests to verify approve/decline send correct body format

  The Bitbucket Cloud API requires POST requests to approve/decline endpoints to have a request body. Previously, the body was `undefined`, causing 400 Bad Request errors.

- [#51](https://github.com/0pilatos0/bitbucket-cli/pull/51) [`03d4ec9`](https://github.com/0pilatos0/bitbucket-cli/commit/03d4ec9b5ee45b71b11c99992bafd279913dce98) Thanks [@0pilatos0](https://github.com/0pilatos0)! - This fixes \`Invalid pagelen\` error when running \`bb pr diff\` without a PR ID.

  The issue was that command was requesting \`pagelen=100\` which exceeds Bitbucket Cloud's maximum of 50 for pull requests.

  **Changes:**
  - Added \`src/constants.ts\` with API pagination limits
  - Added validation to \`PullRequestRepository.list()\` to cap limit at 50
  - Fixed \`diff.command.ts\` to use \`DEFAULT_PAGELEN.PULL_REQUESTS\` (25)
  - Fixed \`edit.command.ts\` to use explicit default limit
  - Added tests for pagelen validation

  **Testing:**
  - All 432 tests pass
  - TypeScript linter passes

  Fixes #42

- [#39](https://github.com/0pilatos0/bitbucket-cli/pull/39) [`7d1ad4e`](https://github.com/0pilatos0/bitbucket-cli/commit/7d1ad4ebfb6b9df8f18dcd5a3aefb7fb1355fdd6) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add comprehensive test coverage for API client, completion command, and base command

  Improvements to test infrastructure:
  - Added `tests/api/client.test.ts` with 397 lines of tests for the API client
  - Added `tests/commands/completion.test.ts` with 179 lines of completion command tests
  - Added `tests/core/base-command.test.ts` with 280 lines of base command tests
  - Enhanced `tests/repositories/pullrequest.repository.test.ts` with 50 additional lines
  - Enhanced `tests/services/http.client.test.ts` with 151 additional lines
  - Updated `src/api/client.ts` with minor improvements (+5 lines)

  Total: 1060 test additions and improvements

## 1.1.0

### Minor Changes

- [#36](https://github.com/0pilatos0/bitbucket-cli/pull/36) [`c470d86`](https://github.com/0pilatos0/bitbucket-cli/commit/c470d86ac90a8b80101a6d8a2e32e398b27ea1e9) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add `bb pr edit` command to edit pull request title and description
  - Update title with `--title` / `-t` flag
  - Update description with `--body` / `-b` flag
  - Read description from file with `--body-file` / `-F` flag
  - Auto-detect PR from current branch when ID is omitted
  - Support JSON output with `--json` flag

### Patch Changes

- [#34](https://github.com/0pilatos0/bitbucket-cli/pull/34) [`8613233`](https://github.com/0pilatos0/bitbucket-cli/commit/861323343607f7ea62dada578df0de2f89e06fe2) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix "Body already used" error when API requests fail (e.g., `pr approve`, `pr decline`)

## 1.0.0

### Major Changes

- [#29](https://github.com/0pilatos0/bitbucket-cli/pull/29) [`df9a3e7`](https://github.com/0pilatos0/bitbucket-cli/commit/df9a3e76013b16a171d8ccb52ba41242dc19e732) Thanks [@0pilatos0](https://github.com/0pilatos0)! - **BREAKING CHANGE**: Migrate from app passwords to API tokens

  As of September 9, 2025, Bitbucket has deprecated app passwords in favor of API tokens. All existing app passwords will be disabled on June 9, 2026.

  ## Breaking Changes
  - Configuration field `appPassword` renamed to `apiToken`
  - Environment variable `BB_APP_PASSWORD` renamed to `BB_API_TOKEN`
  - All references to "app password" updated to "API token" in docs and CLI output

  ## Migration Guide

  After upgrading, users will need to:
  1. Create a new API token at https://bitbucket.org/account/settings/api-tokens/
  2. Re-authenticate using `bb auth login -u your-username -p your-api-token`

  The authentication mechanism (HTTP Basic Auth) remains unchanged - only the terminology and configuration field names have changed.

  ## Documentation Updates
  - Updated authentication guide with API token creation instructions
  - Updated all command documentation references
  - Added deprecation notices about app passwords

### Minor Changes

- [#30](https://github.com/0pilatos0/bitbucket-cli/pull/30) [`dc169ff`](https://github.com/0pilatos0/bitbucket-cli/commit/dc169fff1211b279f4aadb025a893a4ae22c7544) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add `bb pr diff` command to view pull request diffs from the CLI

  Implements issue #20 by adding a new `bb pr diff` command that allows users to view pull request diffs directly from the command line without opening the web interface.

  Features:
  - View full unified diff for a specified PR or current branch
  - `--stat` flag to show diffstat (files changed, insertions, deletions)
  - `--name-only` flag to show only names of changed files
  - `--color` flag to control colored output (auto, always, never)
  - `--web` flag to open PR diff in web browser
  - Automatic PR detection based on current git branch when no ID provided
  - Full unit test coverage for command and repository methods
  - Supports all global options (--workspace, --repo, --json)

### Patch Changes

- [#26](https://github.com/0pilatos0/bitbucket-cli/pull/26) [`d3e14e2`](https://github.com/0pilatos0/bitbucket-cli/commit/d3e14e2820d3da314dd4d7dcddbd33a00a67ae8c) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Comprehensive documentation improvements addressing #25
  - Add missing global options (--workspace, --repo, --json) to all command documentation
  - Fix config key naming inconsistency (defaultWorkspace → workspace)
  - Document all available config keys (username, appPassword, workspace, repo)
  - Add detailed explanations for auth command behavior and requirements
  - Enhance command examples with more use cases
  - Add comprehensive repository context resolution guide
  - Fix Node.js version requirement (v18+ → v20+)
  - Add notes about command behavior (e.g., PR checkout branch naming)
  - Document JSON output support across all commands
  - Add security warnings and best practices throughout

## 0.3.2

### Patch Changes

- [#22](https://github.com/0pilatos0/bitbucket-cli/pull/22) [`5fa1bf3`](https://github.com/0pilatos0/bitbucket-cli/commit/5fa1bf3ac7a182e8bf810001db4ec08438d505fa) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix commands not displaying error messages when validation fails. Commands now properly show error messages and exit with code 1 when required arguments are missing or validation fails.

## 0.3.1

### Patch Changes

- [#18](https://github.com/0pilatos0/bitbucket-cli/pull/18) [`e7970f0`](https://github.com/0pilatos0/bitbucket-cli/commit/e7970f07b676d66a975e9d02970f3446d02fd182) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add npm trusted publisher workflow for secure automated releases
  - New `publish.yml` workflow triggered on GitHub release events
  - Uses OIDC trusted publishing (no NPM_TOKEN secret required)
  - Improved security: no long-lived tokens needed for npm publishing

## 0.3.0

### Minor Changes

- [#6](https://github.com/0pilatos0/bitbucket-cli/pull/6) [`7201f22`](https://github.com/0pilatos0/bitbucket-cli/commit/7201f2214109801f6de3921a87955123aa08a4cb) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add shell completion support for bash, zsh, and fish
  - New `bb completion install` command to set up tab completion
  - New `bb completion uninstall` command to remove completions
  - Completes commands, subcommands, and options
  - Auto-detects shell type during installation

### Patch Changes

- [#12](https://github.com/0pilatos0/bitbucket-cli/pull/12) [`852f0a3`](https://github.com/0pilatos0/bitbucket-cli/commit/852f0a34d36995f7b59aef8f3dadb07c800afb3d) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Improve login command feedback on authentication failure
  - Display error message when authentication fails instead of silently exiting
  - Users now see "Authentication failed: <reason>" when credentials are invalid
  - Helps users debug issues with invalid or expired tokens

- [#3](https://github.com/0pilatos0/bitbucket-cli/pull/3) [`f3a85cc`](https://github.com/0pilatos0/bitbucket-cli/commit/f3a85cc011f271c6a7db98bdb82e61bac120d707) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Add contribution guidelines and changeset enforcement
  - Added CONTRIBUTING.md with development setup, workflow, and release process
  - Added GitHub Action to require changesets on PRs (skips docs-only changes)

- [#14](https://github.com/0pilatos0/bitbucket-cli/pull/14) [`f682af6`](https://github.com/0pilatos0/bitbucket-cli/commit/f682af67254e02e547b363c5b9d7e68f1fda48f7) Thanks [@0pilatos0](https://github.com/0pilatos0)! - fix: prevent test pollution from process.exitCode set in command error handlers

  Commands that set `process.exitCode = 1` on error were causing false test failures.
  The exit code persisted across test files, making `bun test` exit with code 1 even
  when all 344 tests passed. This fix skips setting the exit code when `NODE_ENV=test`.

- [#8](https://github.com/0pilatos0/bitbucket-cli/pull/8) [`c0cd7f0`](https://github.com/0pilatos0/bitbucket-cli/commit/c0cd7f0d8d6ec57bd79faeaefa435d6f96623f14) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Fix workspace option conflict between global and subcommand options
  - Global `-w/--workspace` and `-r/--repo` options now work correctly with all subcommands
  - Added `withGlobalOptions` helper to properly merge CLI options
  - Fixes issue where `bb repo list -w workspace` would fail with "No workspace specified"

## 0.2.0

### Minor Changes

- [`0da57d4`](https://github.com/0pilatos0/bitbucket-cli/commit/0da57d4f65ef1b4fd335c1c0b781579364d22a1f) Thanks [@0pilatos0](https://github.com/0pilatos0)! - Initial release with full CLI functionality
  - Authentication: login, logout, status, token commands
  - Repository management: clone, create, list, view, delete
  - Pull request operations: create, list, view, merge, approve, decline, checkout
  - Configuration management: get, set, list
  - Global options: --json output, --workspace, --repo flags
  - Enterprise architecture with dependency injection

All notable changes to this project will be documented in this file.

## [0.1.0] - Initial Release

### Added

- Initial CLI scaffold with Commander.js
- Enterprise architecture with dependency injection and command pattern
- Authentication commands: `bb auth login`, `bb auth logout`, `bb auth status`, `bb auth token`
- Repository commands: `bb repo clone`, `bb repo create`, `bb repo list`, `bb repo view`, `bb repo delete`
- Pull request commands: `bb pr create`, `bb pr list`, `bb pr view`, `bb pr merge`, `bb pr approve`, `bb pr decline`, `bb pr checkout`
- Configuration commands: `bb config get`, `bb config set`, `bb config list`
- Global options: `--json`, `--workspace`, `--repo`
- Comprehensive test coverage
