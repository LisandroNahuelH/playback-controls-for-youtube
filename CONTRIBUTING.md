# Contributing to Playback Controls for Youtube™

Thanks for considering a contribution.

## Ground rules

- Be kind: this project follows our [Code of Conduct](CODE_OF_CONDUCT.md).
- One logical change per pull request; conventional commit messages (`feat:`, `fix:`, `docs:`, ...), in English.
- English for all repository documentation.
- Never include secrets, tokens or personal data.

## Development setup

```bash
git clone https://github.com/LisandroNahuelH/playback-controls-for-youtube.git
cd playback-controls-for-youtube
npm ci
npm run build      # writes dist/
```

Load `dist/` as an unpacked extension: open `chrome://extensions`, enable "Developer mode", click "Load unpacked" and pick the `dist/` folder.

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | regenerates i18n types, runs the i18n checks, then builds `dist/` with Vite |
| `npm test` | unit tests (vitest, jsdom) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | the full gate: i18n checks + tests + typecheck + build. CI runs exactly this |
| `npm run i18n:check` / `i18n:audit` | locale consistency checks |
| `npm run i18n:bootstrap-locale` / `i18n:bootstrap-all` | bootstrap locale files |

Notes:

- The build regenerates files under `src/generated/`. Commit them when they change.
- The post-build plugin in `vite.config.ts` inlines the content script into the `index.iife` loader only. Do not target `service-worker-loader.js` - see [AGENTS.md](AGENTS.md) for the exact gotcha.

## Before opening a PR

1. Run `npm run verify` - everything green.
2. Update docs affected by the change (`README.md`, `docs/`, `CHANGELOG.md`) in the same PR.
3. Describe what changed and why in the PR body; link the issue if one exists.

## Reporting bugs

Use the [bug report](.github/ISSUE_TEMPLATE/bug.yml). Include the extension version (from `chrome://extensions` or `public/_locales/en/messages.json`), your browser and OS, the exact steps, and any console output.

## Security

Do not open public issues for vulnerabilities - see [SECURITY.md](SECURITY.md).
