const RTL_LOCALE_PREFIXES = ['ar', 'fa', 'he', 'ps', 'sd', 'ug', 'ur', 'yi'] as const;

export function isRtlLocale(locale: string): boolean {
  const normalized = locale.toLowerCase();
  return RTL_LOCALE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`));
}