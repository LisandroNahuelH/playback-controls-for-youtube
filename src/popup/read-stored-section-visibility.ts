import { CONTROL_BAR_SECTION_STORAGE_KEY, DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS, normalizeControlBarSectionVisibility } from '../shared/control-bar-sections';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function readStoredSectionVisibility(): Promise<ReturnType<typeof normalizeControlBarSectionVisibility>> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
  return new Promise((resolve) => {
    try {
      storageArea.get({ [CONTROL_BAR_SECTION_STORAGE_KEY]: DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS }, (items) => {
        resolve(normalizeControlBarSectionVisibility(items[CONTROL_BAR_SECTION_STORAGE_KEY]));
      });
    } catch {
      resolve(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
    }
  });
}
