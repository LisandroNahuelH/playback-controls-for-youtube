import type { I18nKey } from '../generated/i18n-types';

export type UiMessageKey = I18nKey;
export type UiCatalog = Readonly<Record<string, string>>;

export interface ChromeI18nLike {
  getMessage(name: string, substitutions?: string | string[]): string;
  getUILanguage?(): string;
}