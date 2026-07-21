import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';

export function getNextPopupAppearanceId(appearanceId: PopupAppearanceId): PopupAppearanceId {
  return appearanceId === 'dark' ? 'light' : 'dark';
}
