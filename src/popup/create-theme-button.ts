import { t } from '../shared/runtime-i18n';
import type { ControlsTheme } from '../shared/theme-preferences';
import type { PopupContext } from './popup-context';
import { selectTheme } from './select-theme';

export function createThemeButton(context: PopupContext, theme: ControlsTheme): HTMLButtonElement {
  const button = document.createElement('button');
  const swatches = document.createElement('span');
  const text = document.createElement('span');
  const name = document.createElement('span');
  const description = document.createElement('span');
  button.type = 'button';
  button.className = 'theme-option';
  button.dataset.themeId = theme.id;
  button.setAttribute('aria-pressed', 'false');
  swatches.className = 'theme-swatches';
  swatches.setAttribute('aria-hidden', 'true');
  for (const color of [theme.tokens.barBackground, theme.tokens.buttonBackground, theme.tokens.activeBackground]) {
    const swatch = document.createElement('span');
    swatch.style.background = color;
    swatches.append(swatch);
  }
  text.className = 'theme-copy';
  name.className = 'theme-name';
  name.textContent = t(theme.nameKey);
  description.className = 'theme-description';
  description.textContent = t(theme.descriptionKey);
  text.append(name, description);
  button.append(swatches, text);
  button.addEventListener('click', selectTheme.bind(null, context, theme.id));
  return button;
}
