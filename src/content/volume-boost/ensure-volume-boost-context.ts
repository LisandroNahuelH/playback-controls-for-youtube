import { getAudioContextConstructor } from './get-audio-context-constructor';
import type { VolumeBoostState } from './volume-boost-state';

export function ensureVolumeBoostContext(state: VolumeBoostState): AudioContext | null {
  if (state.audioContext) return state.audioContext;
  const AudioContextConstructor = getAudioContextConstructor(state.window);
  if (!AudioContextConstructor) return null;
  state.audioContext = new AudioContextConstructor();
  return state.audioContext;
}
