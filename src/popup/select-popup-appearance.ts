import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';
import type { PopupContext } from './popup-context';
import { setPopupAppearance } from './set-popup-appearance';
import { writeStoredPopupAppearance } from './write-stored-popup-appearance';

export async function selectPopupAppearance(context: PopupContext, appearanceId: PopupAppearanceId): Promise<void> {
  setPopupAppearance(context, appearanceId);
  await writeStoredPopupAppearance(appearanceId);
}
