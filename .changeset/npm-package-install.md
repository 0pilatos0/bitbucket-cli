---
'@pilatos/bitbucket-cli': patch
---

Match the update notice to how `bb` was installed: npm installs now see `npm install -g`, pnpm installs `pnpm add -g`, and Bun installs keep `bun install -g`. Stop shipping the 5.7 MB sourcemap in the npm package, which shrinks the unpacked install from 7.7 MB to 1.9 MB. The docs now show the real error when Bun is missing and how to fix it.
