import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';
import { t } from '../shared/runtime-i18n';
import { getNextPopupAppearanceId } from './get-next-popup-appearance-id';
import type { PopupContext } from './popup-context';
import { POPUP_APPEARANCE_ICONS } from './popup-appearance-icons';
import { POPUP_APPEARANCE_TOGGLE_LABEL_KEYS } from './popup-appearance-toggle-label-keys';

export function setPopupAppearance(context: PopupContext, appearanceId: PopupAppearanceId): void {
  const nextAppearanceId = getNextPopupAppearanceId(appearanceId);
  context.state.appearanceId = appearanceId;
  document.documentElement.dataset.popupAppearance = appearanceId;
  if (!context.elements.appearanceToggleButton) return;
  context.elements.appearanceToggleButton.textContent = POPUP_APPEARANCE_ICONS[appearanceId];
  context.elements.appearanceToggleButton.setAttribute('aria-label', t(POPUP_APPEARANCE_TOGGLE_LABEL_KEYS[nextAppearanceId]));
  context.elements.appearanceToggleButton.setAttribute('aria-pressed', appearanceId === 'dark' ? 'true' : 'false');
}
