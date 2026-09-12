# Changelog

All notable changes to this project. Newest first.

## Unreleased

- Build: the content script is inlined into the `index.iife` loader only, keeping the service worker loader thin (fixes Brave compatibility; commit `10f171c`).

## 0.3.11 - 2026-07-30

- Anonymous diagnostics (Premium11 heartbeat): install/update events, a throttled popup-open ping (at most once per 24 hours) and an uninstall farewell URL. No video ids, titles or history.
- Premium11 brand UI: popup brand link, Montserrat typography, green scrollbar styling.
- 18 store locales.

## 0.3.10 - 2026-07-21

- Premium11 brand in the popup.

## 0.3.9 - 2026-07-21

- Brand tokens and Montserrat typography; chrome-store package.

## Earlier releases

- 0.3.7 and 0.3.8 (July 2026): earlier store packages, kept in `release/`.
