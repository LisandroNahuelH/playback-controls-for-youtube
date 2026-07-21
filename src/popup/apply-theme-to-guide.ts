import { getControlsThemeCssProperties, type ControlsTheme } from '../shared/theme-preferences';
import type { PopupContext } from './popup-context';

export function applyThemeToGuide(context: PopupContext, theme: ControlsTheme): void {
  const { guideList } = context.elements;
  if (!guideList) return;
  const cssProperties = getControlsThemeCssProperties(theme);
  for (const preview of guideList.querySelectorAll<HTMLElement>('[data-role="guide-preview"]')) {
    preview.dataset.theme = theme.id;
    for (const [propertyName, propertyValue] of Object.entries(cssProperties)) {
      preview.style.setProperty(propertyName, propertyValue);
    }
  }
}
