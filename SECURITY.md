# Security Policy

## Supported Versions

Only the latest minor release of `@pilatos/bitbucket-cli` receives security
updates. Please upgrade to the most recent version before reporting an issue.

| Version  | Supported          |
| -------- | ------------------ |
| latest   | :white_check_mark: |
| < latest | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/0pilatos0/bitbucket-cli/security/advisories/new).
This is the only supported channel — it ensures the report stays confidential,
gets triaged in the right place, and can be tracked through to a published
GitHub Security Advisory.

Please include as much of the following as you can:

- A description of the issue and its potential impact
- Steps to reproduce, including a minimal proof-of-concept if possible
- The version of `bb` (`bb --version`), Bun, and your operating system
- Any suggested mitigations or fixes

You should receive an initial response within **5 business days**. We will work
with you to understand and validate the issue, and aim to release a patch
within **30 days** of confirmation depending on severity and complexity.

## Scope

In scope:

- The CLI itself (`@pilatos/bitbucket-cli` / `bb`)
- Authentication, token handling, and credential storage
- Generated API client code in `src/generated/` (logic issues; the upstream
  Bitbucket Cloud API is out of scope)

Out of scope:

- Vulnerabilities in Bitbucket Cloud itself — please report those to
  [Atlassian](https://www.atlassian.com/trust/security)
- Issues that require an already-compromised local machine
- Social engineering of maintainers or users

## Disclosure

We follow a coordinated disclosure process. Once a fix is released, we will
publish a GitHub Security Advisory crediting the reporter (unless anonymity
is requested).
