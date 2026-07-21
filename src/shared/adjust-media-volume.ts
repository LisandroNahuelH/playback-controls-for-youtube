import { clampMediaVolume } from './clamp-media-volume';

export function adjustMediaVolume(currentVolume: number, delta: number): number {
  const nextVolume = Number.isFinite(currentVolume) ? currentVolume + delta : 1 + delta;
  return clampMediaVolume(Math.round(nextVolume * 10) / 10);
}
