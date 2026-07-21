import { setControlBarSectionVisibility, type ControlBarSectionId } from '../shared/control-bar-sections';
import type { PopupContext } from './popup-context';
import { setVisibleSections } from './set-visible-sections';
import { writeStoredSectionVisibility } from './write-stored-section-visibility';

export async function selectSectionVisibility(context: PopupContext, sectionId: ControlBarSectionId, visible: boolean): Promise<void> {
  const nextSections = setControlBarSectionVisibility(context.state.visibleSections, sectionId, visible);
  setVisibleSections(context, nextSections);
  await writeStoredSectionVisibility(nextSections);
}
