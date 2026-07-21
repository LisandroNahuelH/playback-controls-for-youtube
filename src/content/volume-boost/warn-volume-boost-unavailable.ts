import type { VolumeBoostState } from './volume-boost-state';

export function warnVolumeBoostUnavailable(state: VolumeBoostState): void {
  if (state.warnedUnavailable) return;
  state.warnedUnavailable = true;
  state.logger.warn?.();
}
