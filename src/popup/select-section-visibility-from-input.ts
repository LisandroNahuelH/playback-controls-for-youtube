import type { ControlBarSectionId } from '../shared/control-bar-sections';
import type { PopupContext } from './popup-context';
import { selectSectionVisibility } from './select-section-visibility';

export function selectSectionVisibilityFromInput(context: PopupContext, sectionId: ControlBarSectionId, input: HTMLInputElement): void {
  void selectSectionVisibility(context, sectionId, input.checked);
}
