import { getControlsThemeCssProperties, type ControlsTheme } from '../shared/theme-preferences';
import type { PopupContext } from './popup-context';
import { renderPreviewBar } from './render-preview-bar';

export function applyThemeToPreview(context: PopupContext, theme: ControlsTheme): void {
  const { previewBar } = context.elements;
  if (!previewBar) return;
  previewBar.dataset.theme = theme.id;
  for (const [propertyName, propertyValue] of Object.entries(getControlsThemeCssProperties(theme))) {
    previewBar.style.setProperty(propertyName, propertyValue);
  }
  renderPreviewBar(context);
}
