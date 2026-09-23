---
'@pilatos/bitbucket-cli': minor
---

Add four command groups on existing Bitbucket API clients. `bb branch-restriction list|view|create|delete` manages branch protection rules (push, force, delete, merge checks), matching branches by glob `--pattern` or branching-model `--branch-type`, with `--user`/`--group` exemptions for `push` and `restrict_merges`. `bb ssh-key list|add|delete` and `bb gpg-key list|add|delete` manage the keys on your own account, reading the public key from a file or stdin (`-`) and refusing private key material before anything is sent. `bb deployment list|view` inspects Pipelines deployments with environment names resolved, and `bb deployment environments` lists the repository's environments. Deletes ask for confirmation in an interactive terminal and need `--yes` everywhere else; all commands support `--json`/`--jq` and shell completion.
