import { getControlsTheme, type ControlsThemeId } from '../shared/theme-preferences';
import { applyThemeToGuide } from './apply-theme-to-guide';
import { applyThemeToPreview } from './apply-theme-to-preview';
import type { PopupContext } from './popup-context';

export function setSelectedTheme(context: PopupContext, themeId: ControlsThemeId): void {
  context.state.selectedThemeId = themeId;
  const theme = getControlsTheme(themeId);
  applyThemeToPreview(context, theme);
  applyThemeToGuide(context, theme);
  for (const button of context.elements.themeList?.querySelectorAll<HTMLButtonElement>('[data-theme-id]') ?? []) {
    button.setAttribute('aria-pressed', button.dataset.themeId === themeId ? 'true' : 'false');
  }
}
