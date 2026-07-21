import type { ControlBarSectionId } from '../shared/control-bar-sections';
import { createPreviewButton } from './create-preview-button';
import { getPreviewLabels } from './get-preview-labels';

export function createPreviewGroup(sectionId: ControlBarSectionId): HTMLElement {
  const group = document.createElement('span');
  group.className = 'preview-section-group';
  group.dataset.previewSection = sectionId;
  for (const label of getPreviewLabels(sectionId)) group.append(createPreviewButton(label));
  return group;
}
