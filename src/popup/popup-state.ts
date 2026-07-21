import type { ControlBarSectionVisibility } from '../shared/control-bar-sections';
import type { PopupAppearanceId } from '../shared/popup-appearance-preferences';
import type { ControlsThemeId } from '../shared/theme-preferences';

export interface PopupState {
  appearanceId: PopupAppearanceId;
  selectedThemeId: ControlsThemeId;
  visibleSections: ControlBarSectionVisibility;
}
