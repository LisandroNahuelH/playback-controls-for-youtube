import { CONTROL_BAR_SECTION_IDS } from '../shared/control-bar-sections';
import { t } from '../shared/runtime-i18n';
import { createSectionToggle } from './create-section-toggle';
import type { PopupContext } from './popup-context';
import { updateSectionToggleStates } from './update-section-toggle-states';

export function renderSectionOptions(context: PopupContext): void {
  const { sectionToggleList } = context.elements;
  if (!sectionToggleList) return;
  sectionToggleList.replaceChildren(...CONTROL_BAR_SECTION_IDS.map(createSectionToggle.bind(null, context)));
  sectionToggleList.setAttribute('aria-label', t('controlBarSectionsAriaLabel'));
  updateSectionToggleStates(context);
}
