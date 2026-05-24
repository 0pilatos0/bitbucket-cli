---
'@pilatos/bitbucket-cli': patch
---

Self-host the docs site fonts (DM Sans, JetBrains Mono) via
`@fontsource-variable` instead of importing from `fonts.googleapis.com`.
Eliminates the dominant render-blocking request on mobile — Lighthouse
flagged the Google Fonts stylesheet as wasting ~800 ms of mobile LCP.

Variable-font files cover the full 400–700 weight range so the previous
multi-weight CDN URL is now a single bundled woff2 per subset, served
from the same origin.

**Deploy-side follow-up** (not in this repo): add
`Cache-Control: public, max-age=31536000, immutable` for `/_astro/*`.
Astro emits content-hashed filenames there, so they're safe to cache
forever. Lighthouse flagged 9 such files at `cache-lifetime=0`.

Documentation-only change; the CLI is untouched.
