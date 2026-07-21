import { getUiLanguage } from './get-ui-language';
import { isRtlLocale } from './is-rtl-locale';

export function setDocumentLocaleAttributes(
  doc: Document = document,
  locale = getUiLanguage()
): { lang: string; dir: 'ltr' | 'rtl' } {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  doc.documentElement.lang = locale;
  doc.documentElement.dir = dir;
  return { lang: locale, dir };
}