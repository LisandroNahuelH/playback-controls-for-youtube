import { DEFAULT_POPUP_APPEARANCE_ID, normalizePopupAppearanceId, POPUP_APPEARANCE_STORAGE_KEY } from '../shared/popup-appearance-preferences';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function readStoredPopupAppearance(): Promise<ReturnType<typeof normalizePopupAppearanceId>> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve(DEFAULT_POPUP_APPEARANCE_ID);
  return new Promise((resolve) => {
    try {
      storageArea.get({ [POPUP_APPEARANCE_STORAGE_KEY]: DEFAULT_POPUP_APPEARANCE_ID }, (items) => {
        resolve(normalizePopupAppearanceId(items[POPUP_APPEARANCE_STORAGE_KEY]));
      });
    } catch {
      resolve(DEFAULT_POPUP_APPEARANCE_ID);
    }
  });
}
