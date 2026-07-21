import { t } from '../shared/runtime-i18n';
import type { ButtonGuideItem } from './button-guide-item';
import { createGuideButton } from './create-guide-button';

export function createGuideItem(item: ButtonGuideItem): HTMLElement {
  const article = document.createElement('article');
  const title = document.createElement('h3');
  const preview = document.createElement('div');
  const actions = document.createElement('dl');
  article.className = 'guide-item';
  title.textContent = t(item.categoryKey);
  preview.className = 'guide-preview';
  preview.dataset.role = 'guide-preview';
  for (const label of item.sampleButtons) preview.append(createGuideButton(label));
  actions.className = 'guide-actions';
  for (const key of [item.leftClickKey, item.rightClickKey]) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = t(key === item.leftClickKey ? 'leftClickLabel' : 'rightClickLabel');
    description.textContent = t(key);
    actions.append(term, description);
  }
  article.append(title, preview, actions);
  return article;
}
