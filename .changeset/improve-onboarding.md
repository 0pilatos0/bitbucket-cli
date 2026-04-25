---
'@pilatos/bitbucket-cli': patch
---

improve onboarding and first-run experience

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
