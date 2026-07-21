import type { I18nKey } from '../generated/i18n-types';

export const CONTROLS_THEME_STORAGE_KEY = 'playbackControlsForYoutubeTheme';
export const DEFAULT_CONTROLS_THEME_ID = 'classic';

export type ControlsThemeId = 'classic' | 'dark' | 'youtube' | 'ocean' | 'rose';

export interface ControlsThemeTokens {
  barBackground: string;
  barBorder: string;
  barShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  buttonHoverBackground: string;
  activeBackground: string;
  activeBorder: string;
  activeText: string;
  activeShadow: string;
  focusRing: string;
  dividerColor: string;
  borderRadius: string;
}

export interface ControlsTheme {
  id: ControlsThemeId;
  nameKey: I18nKey;
  descriptionKey: I18nKey;
  tokens: ControlsThemeTokens;
}

export const CONTROLS_THEMES: readonly ControlsTheme[] = [
  {
    id: 'classic',
    nameKey: 'themeClassicName',
    descriptionKey: 'themeClassicDescription',
    tokens: {
      barBackground: 'rgba(204, 204, 204, 0.96)',
      barBorder: 'rgba(0, 0, 0, 0.22)',
      barShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
      buttonBackground: '#ffffff',
      buttonText: '#111111',
      buttonBorder: 'rgba(0, 0, 0, 0.16)',
      buttonHoverBackground: '#f1f1f1',
      activeBackground: '#e6f3ff',
      activeBorder: '#3ea6ff',
      activeText: '#065fd4',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.35), 0 0 12px rgba(62, 166, 255, 0.55)',
      focusRing: '#3ea6ff',
      dividerColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '999px'
    }
  },
  {
    id: 'dark',
    nameKey: 'themeDarkName',
    descriptionKey: 'themeDarkDescription',
    tokens: {
      barBackground: 'rgba(22, 24, 28, 0.94)',
      barBorder: 'rgba(255, 255, 255, 0.16)',
      barShadow: '0 8px 22px rgba(0, 0, 0, 0.46)',
      buttonBackground: '#2c3038',
      buttonText: '#f7f7f7',
      buttonBorder: 'rgba(255, 255, 255, 0.14)',
      buttonHoverBackground: '#3a404b',
      activeBackground: '#263f5f',
      activeBorder: '#7ab7ff',
      activeText: '#eaf4ff',
      activeShadow: '0 0 0 1px rgba(122, 183, 255, 0.32), 0 0 14px rgba(122, 183, 255, 0.38)',
      focusRing: '#7ab7ff',
      dividerColor: 'rgba(255, 255, 255, 0.38)',
      borderRadius: '999px'
    }
  },
  {
    id: 'youtube',
    nameKey: 'themeYoutubeName',
    descriptionKey: 'themeYoutubeDescription',
    tokens: {
      barBackground: 'rgba(20, 20, 20, 0.94)',
      barBorder: 'rgba(255, 255, 255, 0.14)',
      barShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
      buttonBackground: '#ffffff',
      buttonText: '#0f0f0f',
      buttonBorder: 'rgba(255, 255, 255, 0.18)',
      buttonHoverBackground: '#ffe7e7',
      activeBackground: '#ff0033',
      activeBorder: '#ff5c75',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 14px rgba(255, 0, 51, 0.46)',
      focusRing: '#ff5c75',
      dividerColor: 'rgba(255, 255, 255, 0.42)',
      borderRadius: '999px'
    }
  },
  {
    id: 'ocean',
    nameKey: 'themeOceanName',
    descriptionKey: 'themeOceanDescription',
    tokens: {
      barBackground: 'rgba(219, 245, 255, 0.95)',
      barBorder: 'rgba(14, 116, 144, 0.28)',
      barShadow: '0 5px 18px rgba(8, 47, 73, 0.24)',
      buttonBackground: '#f8fdff',
      buttonText: '#0f2e3d',
      buttonBorder: 'rgba(14, 116, 144, 0.2)',
      buttonHoverBackground: '#d9f4ff',
      activeBackground: '#0e7490',
      activeBorder: '#22d3ee',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.34), 0 0 13px rgba(34, 211, 238, 0.44)',
      focusRing: '#0891b2',
      dividerColor: 'rgba(15, 46, 61, 0.42)',
      borderRadius: '14px'
    }
  },
  {
    id: 'rose',
    nameKey: 'themeRoseName',
    descriptionKey: 'themeRoseDescription',
    tokens: {
      barBackground: 'rgba(255, 232, 236, 0.96)',
      barBorder: 'rgba(190, 24, 93, 0.22)',
      barShadow: '0 5px 18px rgba(131, 24, 67, 0.22)',
      buttonBackground: '#ffffff',
      buttonText: '#4a102b',
      buttonBorder: 'rgba(190, 24, 93, 0.18)',
      buttonHoverBackground: '#ffe0ea',
      activeBackground: '#be185d',
      activeBorder: '#fb7185',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.36), 0 0 13px rgba(251, 113, 133, 0.42)',
      focusRing: '#e11d48',
      dividerColor: 'rgba(74, 16, 43, 0.4)',
      borderRadius: '10px'
    }
  }
] as const;

const CONTROLS_THEME_IDS = new Set<ControlsThemeId>(CONTROLS_THEMES.map((theme) => theme.id));
const CONTROLS_THEME_BY_ID = Object.fromEntries(CONTROLS_THEMES.map((theme) => [theme.id, theme])) as Record<
  ControlsThemeId,
  ControlsTheme
>;

export function isControlsThemeId(value: unknown): value is ControlsThemeId {
  return typeof value === 'string' && CONTROLS_THEME_IDS.has(value as ControlsThemeId);
}

export function normalizeControlsThemeId(value: unknown): ControlsThemeId {
  return isControlsThemeId(value) ? value : DEFAULT_CONTROLS_THEME_ID;
}

export function getControlsTheme(value: unknown): ControlsTheme {
  return CONTROLS_THEME_BY_ID[normalizeControlsThemeId(value)];
}

export function getControlsThemeCssProperties(theme: ControlsTheme): Record<string, string> {
  return {
    '--yt-controls-bar-background': theme.tokens.barBackground,
    '--yt-controls-bar-border': theme.tokens.barBorder,
    '--yt-controls-bar-shadow': theme.tokens.barShadow,
    '--yt-controls-button-background': theme.tokens.buttonBackground,
    '--yt-controls-button-text': theme.tokens.buttonText,
    '--yt-controls-button-border': theme.tokens.buttonBorder,
    '--yt-controls-button-hover-background': theme.tokens.buttonHoverBackground,
    '--yt-controls-active-background': theme.tokens.activeBackground,
    '--yt-controls-active-border': theme.tokens.activeBorder,
    '--yt-controls-active-text': theme.tokens.activeText,
    '--yt-controls-active-shadow': theme.tokens.activeShadow,
    '--yt-controls-focus-ring': theme.tokens.focusRing,
    '--yt-controls-divider-color': theme.tokens.dividerColor,
    '--yt-controls-border-radius': theme.tokens.borderRadius
  };
}