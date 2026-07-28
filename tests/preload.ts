// Tests must not see the developer's real BB_* environment (see issue #294):
// LoginCommand, ContextService, and ApiClientService all read process.env
// fallbacks, so an exported BB_API_TOKEN silently reroutes the auth tests.
// Tests that need one of these variables set it explicitly.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('BB_')) delete process.env[key];
}
