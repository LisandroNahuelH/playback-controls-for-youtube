import { BUTTON_GUIDE_ITEMS } from './button-guide-items';
import { createGuideItem } from './create-guide-item';
import type { PopupContext } from './popup-context';

export function renderButtonGuide(context: PopupContext): void {
  const { guideList } = context.elements;
  if (!guideList) return;
  guideList.replaceChildren(...BUTTON_GUIDE_ITEMS.map(createGuideItem));
}
