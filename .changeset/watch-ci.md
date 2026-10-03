---
'@pilatos/bitbucket-cli': minor
---

Follow CI from the terminal. `bb pipeline watch [id]` waits for a run to finish and exits non-zero unless it passes, `bb pipeline logs --follow` streams step logs as they are written, and `bb pr checks --watch` waits until no check is running and exits non-zero if one failed or stopped. `bb pipeline view` and `bb pipeline logs` now default to the newest run on the current branch when no id is given. `bb pr checks` reads every page of statuses instead of only the first. A failed watch reports the new error code `10001` (`CI_FAILED`).
