import type { VolumeBoostState } from './volume-boost-state';

export function createVolumeBoostState(window: Window, logger: Pick<Console, 'warn'>): VolumeBoostState {
  return { activeChain: null, audioContext: null, chains: new WeakMap(), logger, warnedUnavailable: false, window };
}
