// Tests must not see the developer's real BB_* environment (see issue #294):
// LoginCommand, ContextService, and ApiClientService all read process.env
// fallbacks, so an exported BB_API_TOKEN silently reroutes the auth tests.
// Tests that need one of these variables set it explicitly.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('BB_')) delete process.env[key];
}

// Tests must never reach the real network (see issue #269): the CLI's
// postAction hook polls registry.npmjs.org for update notices, and without a
// guarantee that no test file triggers it, a local `bun test` on a TTY would
// hit the network (CI only avoids it accidentally via GITHUB_ACTIONS). Replace
// global fetch with a guard that passes through localhost only — the OAuth
// callback tests legitimately spin up a real loopback server — and fails
// loudly on anything else. The guard is replaceable: tests that need to stub
// fetch (version.service.test.ts, oauth.service.test.ts) assign their own
// globalThis.fetch and restore this one afterwards.
const realFetch = globalThis.fetch;

globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (
    url.startsWith('http://localhost:') ||
    url.startsWith('http://127.0.0.1:')
  ) {
    return realFetch(input, init);
  }
  throw new Error(
    `Refusing to reach the real network from tests (guarded by tests/preload.ts): ${url}`
  );
}) as typeof fetch;
