import { CONTROL_BAR_SECTION_LABEL_KEYS, type ControlBarSectionId } from '../shared/control-bar-sections';
import { t } from '../shared/runtime-i18n';
import type { PopupContext } from './popup-context';
import { selectSectionVisibilityFromInput } from './select-section-visibility-from-input';

export function createSectionToggle(context: PopupContext, sectionId: ControlBarSectionId): HTMLLabelElement {
  const label = document.createElement('label');
  const text = document.createElement('span');
  const input = document.createElement('input');
  const switchVisual = document.createElement('span');
  label.className = 'section-toggle';
  text.textContent = t(CONTROL_BAR_SECTION_LABEL_KEYS[sectionId]);
  input.type = 'checkbox';
  input.dataset.sectionId = sectionId;
  input.addEventListener('change', selectSectionVisibilityFromInput.bind(null, context, sectionId, input));
  switchVisual.className = 'section-toggle-switch';
  switchVisual.setAttribute('aria-hidden', 'true');
  label.append(text, input, switchVisual);
  return label;
}
