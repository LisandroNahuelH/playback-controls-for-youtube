import type { ControlsThemeId } from '../shared/theme-preferences';
import { CONTROLS_THEME_STORAGE_KEY } from '../shared/theme-preferences';
import { getChromeStorageArea } from './get-chrome-storage-area';

export function writeStoredThemeId(themeId: ControlsThemeId): Promise<void> {
  const storageArea = getChromeStorageArea();
  if (!storageArea) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      storageArea.set({ [CONTROLS_THEME_STORAGE_KEY]: themeId }, resolve);
    } catch {
      resolve();
    }
  });
}
