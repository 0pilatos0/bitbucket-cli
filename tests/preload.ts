// Tests must not see the developer's real BB_* environment (see issue #294):
// LoginCommand, ContextService, and ApiClientService all read process.env
// fallbacks, so an exported BB_API_TOKEN silently reroutes the auth tests.
// Tests that need one of these variables set it explicitly.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('BB_')) delete process.env[key];
}

// Test output must be terminal-independent (issue #269): chalk colorizes when
// stdout is a TTY, so an interactive `bun test` would emit ANSI codes and
// break string-exact assertions (e.g. the control-character sanitization
// suite). Pin color off before any test file — and therefore before chalk is
// first imported — loads.
process.env.FORCE_COLOR = '0';
process.env.NO_COLOR = '1';

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

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    );
  } catch {
    // Malformed URLs never reach the network anyway — fail loudly instead.
    return false;
  }
}

globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (isLocalhostUrl(url)) {
    return realFetch(input, init);
  }
  throw new Error(
    `Refusing to reach the real network from tests (guarded by tests/preload.ts): ${url}`
  );
}) as typeof fetch;
