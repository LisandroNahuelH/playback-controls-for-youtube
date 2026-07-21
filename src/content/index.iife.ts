import { startYouTubePlaybackSpeedControls } from './youtube-speed';

try {
  startYouTubePlaybackSpeedControls();
} catch (error) {
  console.error('[Playback Controls for YouTube] Failed to initialize:', error);
}
