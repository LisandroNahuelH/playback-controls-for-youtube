import { DEFAULT_CONTROLS_THEME_ID } from '../shared/theme-preferences';
import type { PopupContext } from './popup-context';
import { selectTheme } from './select-theme';

export function resetControlsTheme(context: PopupContext): void {
  void selectTheme(context, DEFAULT_CONTROLS_THEME_ID);
}
