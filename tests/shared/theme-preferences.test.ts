import { describe, expect, it } from 'vitest';
import {
  CONTROLS_THEMES,
  DEFAULT_CONTROLS_THEME_ID,
  getControlsTheme,
  getControlsThemeCssProperties,
  isControlsThemeId,
  normalizeControlsThemeId
} from '../../src/shared/theme-preferences';

describe('controls theme preferences', () => {
  it('normalizes valid and invalid theme ids', () => {
    expect(isControlsThemeId('dark')).toBe(true);
    expect(isControlsThemeId('unknown-theme')).toBe(false);
    expect(normalizeControlsThemeId('ocean')).toBe('ocean');
    expect(normalizeControlsThemeId('unknown-theme')).toBe(DEFAULT_CONTROLS_THEME_ID);
    expect(normalizeControlsThemeId(null)).toBe(DEFAULT_CONTROLS_THEME_ID);
  });

  it('resolves themes and exposes CSS custom properties', () => {
    const theme = getControlsTheme('rose');
    const cssProperties = getControlsThemeCssProperties(theme);

    expect(theme.id).toBe('rose');
    expect(cssProperties['--yt-controls-bar-background']).toBe(theme.tokens.barBackground);
    expect(cssProperties['--yt-controls-active-background']).toBe(theme.tokens.activeBackground);
    expect(cssProperties['--yt-controls-border-radius']).toBe(theme.tokens.borderRadius);
  });

  it('keeps the planned preset theme ids available', () => {
    expect(CONTROLS_THEMES.map((theme) => theme.id)).toEqual(['classic', 'dark', 'youtube', 'ocean', 'rose']);
  });

  it('exposes i18n keys for theme names and descriptions', () => {
    expect(CONTROLS_THEMES.map((theme) => theme.nameKey)).toEqual([
      'themeClassicName',
      'themeDarkName',
      'themeYoutubeName',
      'themeOceanName',
      'themeRoseName'
    ]);
    expect(CONTROLS_THEMES.every((theme) => theme.descriptionKey.startsWith('theme'))).toBe(true);
  });
});
