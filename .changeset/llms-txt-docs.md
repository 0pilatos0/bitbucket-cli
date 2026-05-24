---
'@pilatos/bitbucket-cli': patch
---

Publish `llms.txt` from the docs site so IDE agents (Cursor, Cline,
Continue, Aider, etc.) can pull a clean markdown view of the documentation
on demand. Three files are generated at build time:

- `/llms.txt` — index pointing to the content files
- `/llms-full.txt` — every doc page as concatenated markdown
- `/llms-small.txt` — abridged subset excluding Help/FAQ/Changelog

Implementation uses the `starlight-llms-txt` plugin so the files stay in
sync with the live docs without manual maintenance. A short section in
`guides/ai-agents` documents how to point a tool at the URLs.
