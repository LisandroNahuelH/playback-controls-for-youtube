import { expect, it } from 'vitest';
import {
  DEFAULT_POPUP_APPEARANCE_ID,
  isPopupAppearanceId,
  normalizePopupAppearanceId,
  POPUP_APPEARANCE_IDS,
  POPUP_APPEARANCE_STORAGE_KEY
} from '../../src/shared/popup-appearance-preferences';

it('normalizes popup appearance ids with dark as the default', () => {
  expect(POPUP_APPEARANCE_IDS).toEqual(['dark', 'light']);
  expect(POPUP_APPEARANCE_STORAGE_KEY).toBe('playbackControlsForYoutubePopupAppearance');
  expect(DEFAULT_POPUP_APPEARANCE_ID).toBe('dark');
  expect(isPopupAppearanceId('dark')).toBe(true);
  expect(isPopupAppearanceId('light')).toBe(true);
  expect(isPopupAppearanceId('system')).toBe(false);
  expect(normalizePopupAppearanceId('light')).toBe('light');
  expect(normalizePopupAppearanceId('unknown')).toBe('dark');
  expect(normalizePopupAppearanceId(null)).toBe('dark');
});
