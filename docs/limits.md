# Limits - what is guaranteed, and where the edges are

Read this before promising anything. This file is intentionally blunt.

## Platform

- Chromium only: Chrome, Brave, Edge and other Chromium browsers. Firefox is not supported.
- Developed and verified on Windows with recent Chrome and Brave builds.

## Behavior boundaries

- The control bar is injected into the YouTube watch page. If YouTube changes its player markup, individual controls can stop working until a fix ships. The bar re-attaches automatically when the player is re-rendered.
- Playback-position restore is best-effort: it is stored per browser profile and is not synced across devices.
- Speed changes use fixed 0.05x steps (0.10x with right-click). YouTube's own speed limits still apply.
- Quality selection asks for a preset resolution; if it is not available, the closest one is used. The "Auto" button asks for YouTube's automatic mode.
- Music mode, captions and pin availability depend on the video and player state (for example, captions on videos without caption tracks is a no-op).
- Preferences live in `chrome.storage.local`: they are per browser profile, and clearing extension data resets them.

## Build matrix

| Scenario | What works |
|---|---|
| `npm ci && npm run build` (Node 18+) | full build into `dist/` |
| `npm run verify` (Node 22 in CI) | i18n checks + tests + typecheck + build |
| `npm run package:release` | chrome-store zip; uses PowerShell (Windows only) |

## Updates and durability

- The extension is updated through the Chrome Web Store. Source builds are updated with `git pull`, `npm run build` and a reload of the unpacked `dist/`.
- The content-script inlining step in `vite.config.ts` is load-bearing. If a Vite or `@crxjs` upgrade changes loader names, re-check the inlining output before shipping (see [troubleshooting](troubleshooting.md)).

## Known non-goals

- Firefox or Safari support.
- Server-side features of any kind: everything runs in the browser.
- Analytics beyond the anonymous install/ping diagnostics.

## Privacy

- No telemetry beyond the anonymous diagnostics documented in the [README](../README.md) and the privacy policy (https://www.premium11.com/en/privacidad). No video ids, titles, URLs or browsing history.
- The diagnostics key in the source is public by design: it ships in every published build.
