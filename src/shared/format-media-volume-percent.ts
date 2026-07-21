import { clampMediaVolume } from './clamp-media-volume';

export function formatMediaVolumePercent(volume: number, muted = false): string {
  if (muted) {
    return '0%';
  }

  const safeVolume = clampMediaVolume(volume);
  return `${Math.round(safeVolume * 100)}%`;
}
