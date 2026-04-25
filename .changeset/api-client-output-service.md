---
'@pilatos/bitbucket-cli': patch
---

Route API client retry messages through `IOutputService.warning()` so they no longer bypass the output layer. Retries are now silenced in `--json` mode (preventing stderr noise from leaking into structured pipelines) and outside JSON mode they render with the standard `⚠` prefix and respect `--no-color`. `DEBUG=true` HTTP traces continue to use raw `console.debug` by design — they are an opt-in developer channel.
