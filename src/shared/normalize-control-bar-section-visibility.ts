import { CONTROL_BAR_SECTION_IDS } from './control-bar-section-ids';
import { DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS } from './default-visible-control-bar-sections';
import { hasVisibleControlBarSection } from './has-visible-control-bar-section';
import type { ControlBarSectionVisibility } from './control-bar-section-visibility';

export function normalizeControlBarSectionVisibility(value: unknown): ControlBarSectionVisibility {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS;
  }

  const source = value as Partial<Record<string, unknown>>;
  const visibility = Object.fromEntries(
    CONTROL_BAR_SECTION_IDS.map((sectionId) => [
      sectionId,
      typeof source[sectionId] === 'boolean' ? source[sectionId] : DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS[sectionId]
    ])
  ) as Record<string, boolean>;

  return hasVisibleControlBarSection(visibility as ControlBarSectionVisibility)
    ? (visibility as ControlBarSectionVisibility)
    : DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS;
}
