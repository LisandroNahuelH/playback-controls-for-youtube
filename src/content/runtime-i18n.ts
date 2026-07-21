import type { I18nKey } from '../generated/i18n-types';
import { getFallbackMessage } from '../shared/get-fallback-message';

export function getI18nMessageSafe(key: I18nKey | string, substitutions?: string[]): string {
  try {
    const message = chrome.i18n?.getMessage?.(key, substitutions) ?? '';

    if (message) {
      return message;
    }
  } catch {
    // Fall through when the extension context is stale.
  }

  return getFallbackMessage(key, substitutions) ?? key;
}