import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';
import { POPUP_APPEARANCE_STORAGE_KEY } from '../shared/popup-appearance-preferences';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function writeStoredPopupAppearance(appearanceId: PopupAppearanceId): Promise<void> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      storageArea.set({ [POPUP_APPEARANCE_STORAGE_KEY]: appearanceId }, resolve);
    } catch {
      resolve();
    }
  });
}
