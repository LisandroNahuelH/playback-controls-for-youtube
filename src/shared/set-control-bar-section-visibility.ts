import type { ControlBarSectionId } from './control-bar-section-ids';
import type { ControlBarSectionVisibility } from './control-bar-section-visibility';
import { hasVisibleControlBarSection } from './has-visible-control-bar-section';

export function setControlBarSectionVisibility(
  current: ControlBarSectionVisibility,
  sectionId: ControlBarSectionId,
  visible: boolean
): ControlBarSectionVisibility {
  const next = { ...current, [sectionId]: visible };
  return hasVisibleControlBarSection(next) ? next : current;
}
