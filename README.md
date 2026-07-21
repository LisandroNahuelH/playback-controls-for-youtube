# Playback Controls for Youtube™

Chrome extension in TypeScript that adds `-5%` and `+5%` speed buttons, a live speed indicator, a `|` separator, and quick resolution buttons to the YouTube player controls.

## Scripts

- `npm run build`
- `npm run test`
- `npm run typecheck`

## Behavior

- Active on `youtube.com`
- Adjusts playback speed in fixed `0.05x` steps
- Includes a first `Auto` quality button that asks YouTube for automatic quality
- Picks the closest available YouTube resolution when a requested quality is missing
- Saves each video's playback position and retries restoration when the same video is opened again
- Re-attaches controls when YouTube re-renders the player
