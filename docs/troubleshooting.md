# Troubleshooting

## Build

Run the full gate first:

```bash
npm run verify
```

Build notes:

- `npm run build` runs the i18n checks before Vite. If a locale file is inconsistent, the build stops and names the locale - fix the locale file, do not skip the check.
- After a successful build, the log must contain: `[inline-content] Inlined content script for Brave compatibility: assets/index.iife.ts-loader-....js`. Without that line the content script was not inlined and the bar will not appear in Brave.
- In `dist/`, `service-worker-loader.js` must stay a tiny import (it is the service worker loader). Only the `index.iife` loader carries the inlined content script. A roughly 70 KB `service-worker-loader.js` means the inlining targeted the wrong loader - see the note in [AGENTS.md](../AGENTS.md).
- `dist/` is generated and git-ignored; never commit it.

## The bar does not appear on YouTube

1. Check that the extension is enabled in `chrome://extensions`.
2. Reload the YouTube tab after installing or rebuilding (use the reload icon in `chrome://extensions`).
3. Open the watch page of a regular video (`https://www.youtube.com/watch?v=...`); the bar is injected next to the player.
4. Check the extension's service worker console (`chrome://extensions` -> "service worker") and the page console for errors.
5. Confirm the build actually inlined the content script (see above).

## The bar appears but a button does nothing

- Some controls depend on video state (for example captions on videos without caption tracks).
- After a YouTube player redesign, buttons can break until a fix ships; open an issue with the video type and browser.

## Preferences look reset

Preferences are stored per browser profile in `chrome.storage.local`. Clearing extension/browsing data resets them; reinstalling has the same effect.

## The popup shows the wrong language

The UI language follows the browser locale (`chrome.i18n`). Change the browser language, or use one of the shipped locales listed in `public/_locales/`.

## Reporting

Open an issue with the bug report template and include: extension version, browser and OS, steps, expected vs actual, console output. For security issues, see [SECURITY.md](../SECURITY.md).
