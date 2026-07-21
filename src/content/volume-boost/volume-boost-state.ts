import type { VolumeBoostChain } from './volume-boost-chain';

export interface VolumeBoostState {
  activeChain: VolumeBoostChain | null;
  audioContext: AudioContext | null;
  chains: WeakMap<HTMLMediaElement, VolumeBoostChain>;
  logger: Pick<Console, 'warn'>;
  warnedUnavailable: boolean;
  window: Window;
}
