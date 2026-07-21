import { getVolumeBoostChain } from './get-volume-boost-chain';
import { resetVolumeBoost } from './reset-volume-boost';
import { warnVolumeBoostUnavailable } from './warn-volume-boost-unavailable';
import type { VolumeBoostState } from './volume-boost-state';

export function applyVolumeBoost(state: VolumeBoostState, video: HTMLMediaElement, volume: number): boolean {
  if (volume <= 1) {
    resetVolumeBoost(state);
    return true;
  }
  const chain = getVolumeBoostChain(state, video);
  if (!chain) {
    warnVolumeBoostUnavailable(state);
    resetVolumeBoost(state);
    return false;
  }
  if (state.activeChain && state.activeChain !== chain) state.activeChain.gain.gain.value = 1;
  chain.gain.gain.value = volume;
  state.activeChain = chain;
  return true;
}
