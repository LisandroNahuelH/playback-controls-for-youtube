import { CONTROL_BAR_SECTION_IDS, type ControlBarSectionId } from '../shared/control-bar-sections';
import type { PopupContext } from './popup-context';

export function updateSectionToggleStates(context: PopupContext): void {
  const activeCount = CONTROL_BAR_SECTION_IDS.filter((sectionId) => context.state.visibleSections[sectionId]).length;
  for (const input of context.elements.sectionToggleList?.querySelectorAll<HTMLInputElement>('[data-section-id]') ?? []) {
    const sectionId = input.dataset.sectionId as ControlBarSectionId;
    input.checked = context.state.visibleSections[sectionId];
    input.disabled = input.checked && activeCount === 1;
  }
}
