---
'@pilatos/bitbucket-cli': patch
---

Stop cutting piped output off at 64 KB. Large `--json` and table output now reaches `| jq`, `| wc` and other pipes in full instead of ending mid-document with exit code 0. Shell completion code now loads only when completion runs, which also makes every other command start faster.
