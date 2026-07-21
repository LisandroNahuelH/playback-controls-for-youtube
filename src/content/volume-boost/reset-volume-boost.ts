import type { VolumeBoostState } from './volume-boost-state';

export function resetVolumeBoost(state: VolumeBoostState): void {
  if (state.activeChain) state.activeChain.gain.gain.value = 1;
  state.activeChain = null;
}
