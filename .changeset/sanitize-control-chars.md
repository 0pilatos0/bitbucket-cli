---
'@pilatos/bitbucket-cli': patch
---

security: strip ANSI / OSC / control characters from terminal output

Untrusted strings from the API (PR titles, descriptions, branch names,
snippet file names, repo descriptions, etc.) are now sanitized before
being printed by `OutputService`. This blocks terminal-spoofing primitives
such as OSC-8 hyperlink injection, OSC-0 terminal-title rewrites, and
CSI cursor / screen-clear sequences. Chalk-generated SGR color codes
composed by commands continue to render normally. JSON output is
unchanged.
