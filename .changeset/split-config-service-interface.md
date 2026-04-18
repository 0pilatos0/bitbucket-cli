---
'@pilatos/bitbucket-cli': patch
---

refactor(config): split `IConfigService` into `IConfigService` + `ICredentialStore`

Internal-only change — no user-facing behavior or on-disk format changes. The old `IConfigService` mixed three concerns (app config, basic auth credentials, OAuth token state), forcing every consumer and test mock to depend on the full surface even when they only needed one piece.

- `IConfigService` now covers app config only: `getConfig`, `getValue`, `setValue`, `getConfigPath`, `clearConfig`.
- New `ICredentialStore` covers basic + OAuth credentials: `getAuthMethod`, `get/set/clearCredentials`, `get/set/clearOAuthCredentials`, `isOAuthTokenExpired`.
- `ConfigService` keeps implementing both, so the same JSON file backs both interfaces. A `ServiceTokens.CredentialStore` registration is added as an alias resolving the same singleton, leaving an opening for a future alternative store (e.g. OS keychain) without touching non-auth consumers.
- Commands and services now inject the narrower dependency they actually use. Test mocks gain `createMockConfigServiceOnly` and `createMockCredentialStoreOnly` factories for tests that only exercise one surface.

Resolves #148.
