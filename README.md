<div align="center">

# Playback Controls for Youtube™

**Speed, seek, quality, captions and themes - right on the player.**

A Chrome extension (Manifest V3) that adds a customizable control bar to the YouTube player, so you can act without opening YouTube menus.

`License: MIT` · `Platform: Chrome (MV3)` · `Version: 0.3.11` · `Speed - seek - quality - captions - volume - themes`

</div>

---

## What it is

Playback Controls for Youtube™ adds a compact control bar to the YouTube watch page. Every action is one click away: playback speed in 0.05x steps, instant reset to 1.00x, 15/30/60-second seek, quality presets, captions, volume, music mode and a pin that keeps the player controls visible. The popup configures the bar: five themes, section visibility and an on-screen button guide.

The extension is published on the Chrome Web Store. It runs only on youtube.com and stores preferences locally.

| Feature | What it does |
|---|---|
| Speed | Click to change speed by 0.05x, right-click by 0.10x |
| Reset | Return playback speed to 1.00x instantly |
| Seek | Forward 15/30/60 seconds and rewind 15/30/60 seconds |
| Quality | Ask YouTube for Auto, or request a preset resolution - the closest available is used |
| Captions | Toggle captions from the bar |
| Volume | Click to change volume by 10%, right-click by 20% |
| Music mode | Audio-first mode for music videos |
| Pin | Keep the player controls visible |
| Themes | Classic, Dark, Ocean, Rose and YouTube styles for the control bar |
| Guide | The popup includes a guide that explains every left-click and right-click action |

## How it works

Three surfaces, one small codebase:

```
youtube.com watch page
  |-- content script (src/content/index.iife.ts)   -> the control bar next to the player
  |-- popup (src/popup/index.html)                 -> theme, sections, button guide
  |-- service worker (src/background/index.ts)     -> anonymous install/update diagnostics

src/shared/*                -> preferences, section visibility, i18n helpers
src/features/heartbeat/*    -> anonymous diagnostics (isolated on purpose)
```

The content script re-attaches the bar when YouTube re-renders the player, and remembers per-video playback positions for restoration. The popup writes preferences to `chrome.storage`; the content script reads them live. The build pipeline inlines the content script into a classic script for Brave compatibility - details in [architecture.md](architecture.md).

## What gets installed

| # | Piece | What it is | Where it lands |
|---|---|---|---|
| 1 | The extension | Manifest V3 build of this source (`dist/`) | Chrome or a Chromium-based browser |
| 2 | Store package | `release/playback-controls-for-youtube-tm-v0.3.11-chrome-store.zip` | upload artifact for the Chrome Web Store |

Nothing else is installed, and no system files are touched.

## Quick start

### 1. Install from the Chrome Web Store (recommended)

Open the store listing and click "Add to Chrome":

https://chromewebstore.google.com/detail/lmelkfedknejbehkbmoehdmnmoloaflo

Then open any YouTube video and look at the bar under the player.

### 2. Build from source

```bash
git clone https://github.com/LisandroNahuelH/playback-controls-for-youtube.git
cd playback-controls-for-youtube
npm ci
npm run build          # writes dist/
```

Load it in Chrome: open `chrome://extensions`, enable "Developer mode", click "Load unpacked" and pick the `dist/` folder. If the bar does not appear, see [docs/troubleshooting.md](docs/troubleshooting.md).

### 3. Agent path

Hand this repository to an agent and point it at [AGENTS.md](AGENTS.md) - the runbook with exact commands, expected output and a verification checklist.

## Requirements

- Chrome or a Chromium-based browser with Manifest V3. Developed and verified on Chrome and Brave on Windows.
- Node.js 18 or newer and npm (build from source only; CI runs Node 22).
- No accounts, no server, no API keys.

## Security & privacy

The extension has a small, auditable touch surface:

- It runs only on `youtube.com` pages, where it adds the control bar and changes player state (speed, volume, quality, captions).
- Preferences and the anonymous install id live in `chrome.storage.local`.
- The only network call is the anonymous diagnostics heartbeat to `premium11.com` (see below).
- No credentials, tokens or personal data exist in this repository.

**Anonymous diagnostics.** On install and update, and on a throttled ping when the popup opens (at most once per 24 hours), the extension sends a small anonymous heartbeat to `premium11.com`: a random install id (created locally, not linked to your account), extension version, install channel, UI locale, IANA timezone, event type and a timestamp. No video ids, titles, URLs or browsing history are ever sent. After uninstall, Chrome may open a farewell page that records an anonymous uninstall event. The key in `src/features/heartbeat/constants/heartbeat-api-key.ts` is a public anti-spam key by design: it travels in every published build. The diagnostics have no toggle; removing the extension stops them. Full policy: https://www.premium11.com/en/privacidad

Audit the claims yourself:

```bash
npm run verify     # i18n checks + tests + typecheck + build - the same gate CI runs
npm test           # unit tests (vitest) only
```

## Limits (honest ones)

- Chromium only: Chrome, Brave, Edge and other Chromium browsers. Firefox is not supported.
- The bar depends on the YouTube player DOM. When YouTube changes its player, individual controls can break until a fix ships - the bar already re-attaches automatically on re-renders.
- Playback-position restore is best-effort and per browser profile.
- Speed changes use fixed 0.05x steps (0.10x with right-click); YouTube's own limits still apply.
- The anonymous diagnostics have no in-extension toggle.

## Uninstall

1. Open `chrome://extensions`.
2. Find "Playback Controls for Youtube™" and click "Remove".

Preferences and the anonymous install id are deleted with the extension. If you built from source, you can also delete the local `dist/` folder.

## Documentation

| Doc | For |
|---|---|
| [AGENTS.md](AGENTS.md) | the agent runbook: build, verify, publish |
| [architecture.md](architecture.md) | runtime surfaces and the build pipeline |
| [docs/limits.md](docs/limits.md) | what is guaranteed, and the edges |
| [docs/troubleshooting.md](docs/troubleshooting.md) | build and runtime recovery |
| [docs/third-party-notices.md](docs/third-party-notices.md) | font attribution (Montserrat, OFL) |
| [CHANGELOG.md](CHANGELOG.md) | version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | development workflow |
| [SECURITY.md](SECURITY.md) | reporting a vulnerability |

## FAQ

<details><summary>Does it need my Google account or any login?</summary>

No. The extension runs locally on youtube.com pages. There is no login, no API key and no server account.

</details>

<details><summary>Does it collect my data?</summary>

Only the anonymous install/ping diagnostics described in Security & privacy above: no video ids, titles, URLs or history. Preferences never leave your browser.

</details>

<details><summary>Will it slow down YouTube?</summary>

It is one content script plus a small popup. The bar re-attaches only when the player is re-rendered.

</details>

<details><summary>Can I choose which buttons show?</summary>

Yes. Open the popup: every control-bar section (time, speed, volume, quality, music, captions, pin) can be toggled, and you can pick one of five themes.

</details>

<details><summary>Why 0.05x speed steps?</summary>

Precision. YouTube's own menu jumps in 0.25x steps; 0.05x lets you fine-tune speech and music.

</details>

<details><summary>Is this affiliated with YouTube?</summary>

No. This is an independent project. Not affiliated with YouTube or Google. YouTube is a trademark of Google LLC.

</details>

## Credits

- Built by [@LisandroNahuelH](https://github.com/LisandroNahuelH) (Premium11).
- Fonts: Montserrat, licensed under the SIL Open Font License - see [docs/third-party-notices.md](docs/third-party-notices.md).
- MIT licensed - see [LICENSE](LICENSE).
- Not affiliated with YouTube or Google. YouTube is a trademark of Google LLC.
