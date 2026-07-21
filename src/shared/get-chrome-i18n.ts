import type { ChromeI18nLike } from './runtime-i18n-types';

export function getChromeI18n(): ChromeI18nLike | null {
  return typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n : null;
}