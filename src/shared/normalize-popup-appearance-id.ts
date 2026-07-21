import { DEFAULT_POPUP_APPEARANCE_ID } from './default-popup-appearance-id';
import { isPopupAppearanceId } from './is-popup-appearance-id';
import type { PopupAppearanceId } from './popup-appearance-id';

export function normalizePopupAppearanceId(value: unknown): PopupAppearanceId {
  return isPopupAppearanceId(value) ? value : DEFAULT_POPUP_APPEARANCE_ID;
}
