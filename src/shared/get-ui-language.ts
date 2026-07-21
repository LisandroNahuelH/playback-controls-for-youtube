import { getChromeI18n } from './get-chrome-i18n';
import type { ChromeI18nLike } from './runtime-i18n-types';

export function getUiLanguage(api: ChromeI18nLike | null = getChromeI18n()): string {
  return api?.getUILanguage?.() ?? globalThis.navigator?.language ?? 'en';
}