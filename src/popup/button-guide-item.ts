import type { I18nKey } from '../generated/i18n-types';

export interface ButtonGuideItem {
  categoryKey: I18nKey;
  sampleButtons: string[];
  leftClickKey: I18nKey;
  rightClickKey: I18nKey;
}
