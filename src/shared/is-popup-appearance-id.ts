import { POPUP_APPEARANCE_IDS } from './popup-appearance-ids';
import type { PopupAppearanceId } from './popup-appearance-id';

export function isPopupAppearanceId(value: unknown): value is PopupAppearanceId {
  return typeof value === 'string' && POPUP_APPEARANCE_IDS.includes(value as PopupAppearanceId);
}
