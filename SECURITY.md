# Security policy

## Scope

This repository contains a browser extension plus its build tooling (client-side only, Manifest V3). There is no server component in this repository.

## What the extension can touch

| Surface | What it does |
|---|---|
| `youtube.com` pages | injects the control bar and reads/writes player state (speed, volume, quality, captions) |
| `chrome.storage.local` | stores preferences and the anonymous install id |
| `premium11.com` | sends the anonymous diagnostics heartbeat only |

Nothing else is read or written. No credentials, tokens or personal data exist in this repository.

## The public anti-spam key

`src/features/heartbeat/constants/heartbeat-api-key.ts` contains a soft anti-spam key that ships in every published build of the extension. It is public by design: it grants nothing on its own, and the endpoint validates shape and rate. Please do not report it as a leaked secret.

If you believe you found a real credential or token in this repository, report it through the channel below.

## Reporting a vulnerability

Use GitHub private vulnerability reporting: open the repository's Security tab and click "Report a vulnerability".

Please include:

- extension version (from `chrome://extensions` or `public/_locales/en/messages.json`);
- browser and OS;
- steps to reproduce;
- expected vs actual behavior;
- console output, when relevant (no personal data).

Do not open public issues for vulnerabilities.

## Out of scope

- YouTube itself or the Chrome Web Store platform (report to Google).
- Other extensions.
