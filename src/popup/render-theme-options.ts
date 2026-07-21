import { CONTROLS_THEMES } from '../shared/theme-preferences';
import { createThemeButton } from './create-theme-button';
import type { PopupContext } from './popup-context';

export function renderThemeOptions(context: PopupContext): void {
  const { themeList } = context.elements;
  if (!themeList) return;
  themeList.replaceChildren(...CONTROLS_THEMES.map(createThemeButton.bind(null, context)));
}
