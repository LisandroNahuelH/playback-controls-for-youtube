import type { I18nKey } from '../generated/i18n-types';
import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';

export const POPUP_APPEARANCE_TOGGLE_LABEL_KEYS: Record<PopupAppearanceId, I18nKey> = {
  dark: 'popupAppearanceToggleToDarkAriaLabel',
  light: 'popupAppearanceToggleToLightAriaLabel'
};
