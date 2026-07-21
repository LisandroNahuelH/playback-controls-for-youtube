import { ensureVolumeBoostContext } from './ensure-volume-boost-context';
import type { VolumeBoostChain } from './volume-boost-chain';
import type { VolumeBoostState } from './volume-boost-state';

export function createVolumeBoostChain(state: VolumeBoostState, video: HTMLMediaElement): VolumeBoostChain | null {
  const audioContext = ensureVolumeBoostContext(state);
  if (!audioContext) return null;
  try {
    const source = audioContext.createMediaElementSource(video);
    const gain = audioContext.createGain();
    source.connect(gain);
    gain.connect(audioContext.destination);
    return { gain, source };
  } catch {
    return null;
  }
}
