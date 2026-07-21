import { CONTROLS_THEME_STORAGE_KEY, DEFAULT_CONTROLS_THEME_ID, normalizeControlsThemeId } from '../shared/theme-preferences';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function readStoredThemeId(): Promise<ReturnType<typeof normalizeControlsThemeId>> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve(DEFAULT_CONTROLS_THEME_ID);
  return new Promise((resolve) => {
    try {
      storageArea.get({ [CONTROLS_THEME_STORAGE_KEY]: DEFAULT_CONTROLS_THEME_ID }, (items) => {
        resolve(normalizeControlsThemeId(items[CONTROLS_THEME_STORAGE_KEY]));
      });
    } catch {
      resolve(DEFAULT_CONTROLS_THEME_ID);
    }
  });
}
