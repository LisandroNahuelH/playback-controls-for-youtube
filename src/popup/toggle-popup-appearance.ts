import { getNextPopupAppearanceId } from './get-next-popup-appearance-id';
import type { PopupContext } from './popup-context';
import { selectPopupAppearance } from './select-popup-appearance';

export function togglePopupAppearance(context: PopupContext): void {
  void selectPopupAppearance(context, getNextPopupAppearanceId(context.state.appearanceId));
}
