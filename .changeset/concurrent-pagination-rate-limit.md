---
'@pilatos/bitbucket-cli': minor
---

perf: bounded concurrent page fetching for `--all` plus a proactive client-side rate limiter (#277). When the first page reports the collection's total `size`, remaining pages are fetched up to 4 in flight and concatenated in page order, roughly halving wall-clock time for large collections; without a usable `size` the walk stays sequential. The shared axios instance now also paces request starts from `X-RateLimit-Remaining`/`X-RateLimit-Reset` headers once the budget runs low, so bulk runs stay under Bitbucket's limits instead of reacting to 429s after the fact.
