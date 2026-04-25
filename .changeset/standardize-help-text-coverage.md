---
'@pilatos/bitbucket-cli': patch
---

docs(cli): standardize `--help` text coverage across all commands. PR `approve`/`decline`/`ready`/`checkout`, PR `comments edit`/`delete`, PR `reviewers add`/`remove`, snippet `watch`/`unwatch`/`comments delete`/`comments edit`, `auth logout`, and `completion install`/`uninstall` now include multiple realistic examples and (where applicable) `validValues` blocks. `pr merge --strategy` documents the API default. `bb snippet comments add` now also accepts `<message>` as a positional argument for parity with `bb pr comments add`, and its help marks the message as required. A new test guarantees every leaf command exposes an Examples block.
