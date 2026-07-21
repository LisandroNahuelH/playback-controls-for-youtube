import { createVolumeBoostChain } from './create-volume-boost-chain';
import type { VolumeBoostChain } from './volume-boost-chain';
import type { VolumeBoostState } from './volume-boost-state';

export function getVolumeBoostChain(state: VolumeBoostState, video: HTMLMediaElement): VolumeBoostChain | null {
  const existing = state.chains.get(video);
  if (existing) return existing;
  const chain = createVolumeBoostChain(state, video);
  if (chain) state.chains.set(video, chain);
  return chain;
}
