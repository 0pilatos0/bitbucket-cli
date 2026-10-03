---
'@pilatos/bitbucket-cli': minor
---

Tables now fit the terminal: widths are measured on screen (colors and wide characters align), long titles and descriptions shrink to the window instead of being cut at a fixed length, and `--no-truncate` still prints everything. Piped tables print tab-separated rows without a header and with ISO 8601 dates, like `gh`, and list hints such as "Showing N results" move to stderr. List date columns show relative times on a terminal, and `bb pr list` gains an UPDATED column. `bb pr diff`, `bb pr view` and `bb pipeline logs` open in a pager on a terminal (`BB_PAGER`, then `PAGER`, default `less -FRX`; set `BB_PAGER=` to turn it off).
