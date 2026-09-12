# AGENTS.md - Playback Controls for Youtube™ (agent runbook)

You are an agent working on **Playback Controls for Youtube™**, a Chrome Manifest V3 extension that adds a control bar to the YouTube player. This file is the operational runbook: build, verify, package, publish. Follow it top to bottom; every command is copy-pasteable and every check has expected output.

Boundary: Chromium browsers only. Windows is the reference environment (the release packager uses PowerShell). If your host does not match, stop and report - do not improvise.

## 0. Preflight

```bash
node --version                 # expect: v18+ (CI runs 22)
npm --version                  # expect: 10+
git status --porcelain=v1 -b   # expect: branch main, clean tree
```

If any check fails, stop and report exactly which one.

## 1. Build

```bash
npm ci
npm run build        # = i18n:generate && i18n:check && i18n:audit && vite build
```

**Read the build log.** It MUST contain:

```
[inline-content] Inlined content script for Brave compatibility: assets/index.iife.ts-loader-....js
```

The post-build plugin `inlineContentScript()` in `vite.config.ts` bundles the content script into a classic IIFE at the `index.iife` loader. It must match ONLY `index.iife` loaders - never `service-worker-loader.js`. A mismatch inlines roughly 70 KB of YouTube UI code into the service worker and leaves the content loader pointing at a deleted chunk, so the overlay never mounts.

Verify the build layout:

```bash
wc -c dist/service-worker-loader.js            # expect: small import (< 2 KB)
ls -la dist/assets/index.iife.ts-loader-*.js   # expect: large (~70 KB, the inlined script)
```

## 2. Verify (the full gate)

```bash
npm run verify       # i18n:check + i18n:audit + test + typecheck + build
```

CI runs exactly this on every push and pull request (`.github/workflows/ci.yml`). Run it locally before pushing.

## 3. Load the unpacked extension (manual test)

1. `chrome://extensions` -> enable "Developer mode" -> "Load unpacked" -> select `dist/`.
2. Open a YouTube watch page; the control bar appears next to the player.
3. Reload the extension from `chrome://extensions` after every rebuild.

## 4. Package a release (Windows)

```bash
npm run package:release   # PowerShell; writes release/playback-controls-for-youtube-tm-v<version>-chrome-store.zip
```

The zip is the upload artifact for the Chrome Web Store. Keep released packages in `release/`.

## 5. Chrome Web Store facts

- Extension ID: `lmelkfedknejbehkbmoehdmnmoloaflo`
- Product slug (diagnostics / support / goodbye): `youtube-playback-speed`
- Privacy policy: https://www.premium11.com/en/privacidad
- Admin dashboard: https://www.premium11.com/admin
- Publishing registry: the owner's Chrome Web Store publishing workspace (outside this repository).

## 6. Anonymous diagnostics (heartbeat)

- Code: `src/features/heartbeat/*` -> `POST https://www.premium11.com/api/heartbeat` with the `X-Heartbeat-Key` header.
- Events: `install` / `update` (service worker `onInstalled`) and `ping` on popup open (24h throttle).
- Payload: `{ v:1, product:'youtube-playback-speed', event, extVersion, installId, installChannel, locale, timezone, ts }` - no video ids, URLs or watch history.
- Storage keys: `ypsInstallId`, `ypsLastHeartbeatAt`.
- Uninstall: Chrome cannot run service worker code on uninstall. `chrome.runtime.setUninstallURL` -> `https://www.premium11.com/goodbye/youtube-playback-speed?id=<uuid>&v=<version>`; the site records the uninstall when the page opens. Do not `fetch` on extension removal - it never runs.
- The key in `src/features/heartbeat/constants/heartbeat-api-key.ts` is public by design (soft anti-spam; it ships in every published build). Rotating it requires a matching backend change, not a repo-only edit.
- Wire: `registerHeartbeatOnInstalled()` + `registerUninstallFarewellUrl()` in `src/background/index.ts`; `sendAnonymousHeartbeat('ping')` in `src/popup/init-popup.ts`.

## 7. Verification checklist

1. `npm run verify` exits 0.
2. Build log shows the inlining line; `dist/service-worker-loader.js` is small.
3. The unpacked extension loads and the bar renders on a watch page.
4. `git status` is clean; `dist/` is ignored and never committed.
5. Markdown links resolve; no secrets (the heartbeat key is the documented exception, see SECURITY.md).

## 8. Failure protocol

| Symptom | Meaning | Do |
|---|---|---|
| build log missing the inlining line | content script not inlined | check the plugin targets the `index.iife` loader only; rerun |
| `service-worker-loader.js` ~70 KB | inlining hit the wrong loader | fix the match in `vite.config.ts`; never ship that build |
| i18n check fails | a locale file is inconsistent | fix the named locale; never skip the check |
| bar missing after install | stale build or extension not reloaded | rebuild, reload the extension, reopen the tab |
| `npm ci` fails | node or lockfile mismatch | check `node --version`; remove `node_modules/` and retry |

## 9. What you must not do

- Do not commit `dist/` (generated). `release/` only receives released packages.
- Do not target `service-worker-loader.js` in the inlining plugin.
- Do not change the heartbeat payload shape or the product slug without updating the Premium11 backend and the privacy policy.
- Do not duplicate speed/volume constants outside `src/shared/`.
- Do not build two release packages in parallel.

## Manual path (for humans)

See the Quick start section of [README.md](README.md).
