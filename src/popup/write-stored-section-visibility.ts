import type { ControlBarSectionVisibility } from '../shared/control-bar-sections';
import { CONTROL_BAR_SECTION_STORAGE_KEY } from '../shared/control-bar-sections';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function writeStoredSectionVisibility(sections: ControlBarSectionVisibility): Promise<void> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      storageArea.set({ [CONTROL_BAR_SECTION_STORAGE_KEY]: sections }, resolve);
    } catch {
      resolve();
    }
  });
}
