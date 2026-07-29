# Architecture — YouTube Playback Speed Controls

MV3 extension: content script injects a customizable control bar on YouTube watch pages; popup configures themes, visible sections, and appearance.

## Runtime surfaces

| Surface | Entry | Role |
| --- | --- | --- |
| Service worker | `src/background/index.ts` | Heartbeat install/update, uninstall farewell URL |
| Popup | `src/popup/init-popup.ts` | Settings UI, heartbeat ping |
| Content | `src/content/index.iife.ts` | Player controls, speed/quality/skip UI on YouTube |

## Premium11 diagnostics

```
SW onInstalled → heartbeat install|update
Popup open     → heartbeat ping (24h throttle)
SW boot        → setUninstallURL → /goodbye/youtube-playback-speed
```

Product slug `youtube-playback-speed` must match Premium11 `lib/stats/products.ts` allowlist. Install id in `chrome.storage.local` (`ypsInstallId`).

## Portability note

Player/control-bar logic stays in content scripts and shared prefs; heartbeat is isolated under `src/features/heartbeat/` with no YouTube DOM rules inside those modules.
