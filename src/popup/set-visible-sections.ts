import { normalizeControlBarSectionVisibility, type ControlBarSectionVisibility } from '../shared/control-bar-sections';
import type { PopupContext } from './popup-context';
import { renderPreviewBar } from './render-preview-bar';
import { updateSectionToggleStates } from './update-section-toggle-states';

export function setVisibleSections(context: PopupContext, sections: ControlBarSectionVisibility): void {
  context.state.visibleSections = normalizeControlBarSectionVisibility(sections);
  renderPreviewBar(context);
  updateSectionToggleStates(context);
}
