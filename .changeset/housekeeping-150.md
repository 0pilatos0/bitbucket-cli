---
'@pilatos/bitbucket-cli': patch
---

Housekeeping bundle (#150):

- Document why the OAuth default client credentials shipped in the CLI are not a secret leak, so future readers don't rotate them thinking they were exposed.
- Add a `.npmignore` as belt-and-suspenders alongside the existing `files` whitelist in `package.json`.
- Replace the fragile substring check that disambiguated `bb snippet comments` from `bb pr comments` during tab completion with a tokenized parent-command lookup. Also enables `list / add / edit / delete` completions for `bb pr comments <TAB>`, which previously offered none.
