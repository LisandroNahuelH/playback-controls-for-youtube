import { DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS } from '../shared/control-bar-sections';
import type { PopupContext } from './popup-context';
import { setVisibleSections } from './set-visible-sections';
import { writeStoredSectionVisibility } from './write-stored-section-visibility';

export function resetSectionsToDefault(context: PopupContext): void {
  setVisibleSections(context, DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
  void writeStoredSectionVisibility(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
}
