import type { I18nKey, I18nSubstitutionsFor } from '../generated/i18n-types';
import { getChromeI18n } from './get-chrome-i18n';
import { getFallbackMessage } from './get-fallback-message';
import type { ChromeI18nLike } from './runtime-i18n-types';
import { toOrderedSubstitutions } from './to-ordered-substitutions';

export function t<K extends I18nKey>(
  key: K,
  substitutions?: I18nSubstitutionsFor<K>,
  api: ChromeI18nLike | null = getChromeI18n()
): string {
  const chromeI18n = api ?? getChromeI18n();
  const orderedSubstitutions = toOrderedSubstitutions(key, substitutions);

  if (chromeI18n) {
    const message =
      orderedSubstitutions.length === 0
        ? chromeI18n.getMessage(key)
        : chromeI18n.getMessage(key, orderedSubstitutions);

    if (message) {
      return message;
    }
  }

  return getFallbackMessage(key, orderedSubstitutions) ?? key;
}