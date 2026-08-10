# AGENTS.md — YouTube Playback Speed Controls

## Build

- `npm run build` → `dist/`. Reload unpacked extension manually after build.
- Post-build plugin `inlineContentScript()` in `vite.config.ts` bundles the content script into a classic IIFE at `assets/index.iife.ts-loader-*.js` (Brave compatibility). **Must match only `index.iife` loaders** — never `service-worker-loader.js` (would break SW + YouTube overlay).
- After build, verify log: `[inline-content] Inlined content script for Brave compatibility: assets/index.iife.ts-loader-...` and `service-worker-loader.js` stays a tiny `import './assets/index.ts-...js'`.

## Heartbeat (anonymous diagnostics)

- Feature: `src/features/heartbeat/*` → `POST https://www.premium11.com/api/heartbeat` with `X-Heartbeat-Key`.
- Events: `install` / `update` (SW `onInstalled` via `registerHeartbeatOnInstalled`) + `ping` on popup open (24h throttle).
- Payload: `{ v:1, product:'youtube-playback-speed', event, extVersion, installId, installChannel, locale, timezone, ts }` — no video ids, URLs, or watch history.
- Storage: `ypsInstallId`, `ypsLastHeartbeatAt` (`heartbeat-storage-keys.ts`).
- Wire: `registerHeartbeatOnInstalled()` + `registerUninstallFarewellUrl()` in `src/background/index.ts`; `sendAnonymousHeartbeat('ping')` in `src/popup/init-popup.ts`.
- Manifest `host_permissions`: `https://www.premium11.com/*`, `https://premium11.com/*`.

## Heartbeat uninstall

- Chrome cannot run SW code on uninstall. Use `chrome.runtime.setUninstallURL` → `https://www.premium11.com/goodbye/youtube-playback-speed?id=<uuid>&v=<version>`.
- Wire: `registerUninstallFarewellUrl()` on SW boot + `onInstalled` + `onStartup`.
- Site records uninstall on page open and feedback via `POST /api/goodbye` (no `X-Heartbeat-Key`).
- Do not `fetch` on extension remove — it never runs.

## Chrome Web Store

- **Extension ID:** `lmelkfedknejbehkbmoehdmnmoloaflo`
- **Slug (heartbeat / support / goodbye):** `youtube-playback-speed`
- **Privacy policy (CWS):** `https://www.premium11.com/en/privacidad` (alias `/privacy`)
- **Admin dashboard:** `https://www.premium11.com/admin`
- Registry CLI: `D:\OfiSync\0. Lisandro\0. Programacion\0. Chrome Web Store Publish\extensions.json`
