import { MAX_MEDIA_VOLUME, MIN_MEDIA_VOLUME } from './media-volume-limits';

export function clampMediaVolume(volume: number): number {
  const safeVolume = Number.isFinite(volume) ? volume : MAX_MEDIA_VOLUME / 2;
  return Math.min(MAX_MEDIA_VOLUME, Math.max(MIN_MEDIA_VOLUME, safeVolume));
}
