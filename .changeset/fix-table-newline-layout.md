---
'@pilatos/bitbucket-cli': patch
---

Fix table output breaking when a cell value contains a newline, carriage return, or tab (e.g. a repository description with a line break). Such whitespace control characters are now collapsed to a single space within table cells so every row stays on one line and columns stay aligned. Multi-line `text()` output is unaffected.
