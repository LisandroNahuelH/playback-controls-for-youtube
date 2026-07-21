import { CONTROL_BAR_SECTION_IDS } from '../shared/control-bar-sections';
import { createPreviewGroup } from './create-preview-group';
import type { PopupContext } from './popup-context';

export function renderPreviewBar(context: PopupContext): void {
  const { previewBar } = context.elements;
  const children: HTMLElement[] = [];
  if (!previewBar) return;
  for (const sectionId of CONTROL_BAR_SECTION_IDS) {
    if (!context.state.visibleSections[sectionId]) continue;
    if (children.length > 0) {
      const divider = document.createElement('span');
      divider.setAttribute('aria-hidden', 'true');
      divider.textContent = '|';
      children.push(divider);
    }
    children.push(createPreviewGroup(sectionId));
  }
  previewBar.replaceChildren(...children);
}
