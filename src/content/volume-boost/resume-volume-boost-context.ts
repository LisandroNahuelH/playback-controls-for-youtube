import type { VolumeBoostState } from './volume-boost-state';

export async function resumeVolumeBoostContext(state: VolumeBoostState): Promise<void> {
  try {
    if (state.audioContext?.state === 'suspended') await state.audioContext.resume();
  } catch {
    state.logger.warn?.();
  }
}
