import { CONTROL_BAR_SECTION_IDS } from './control-bar-section-ids';
import type { ControlBarSectionVisibility } from './control-bar-section-visibility';

export function hasVisibleControlBarSection(visibility: ControlBarSectionVisibility): boolean {
  return CONTROL_BAR_SECTION_IDS.some((sectionId) => visibility[sectionId]);
}
