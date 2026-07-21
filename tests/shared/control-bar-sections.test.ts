import { expect, it } from 'vitest';
import {
  CONTROL_BAR_SECTION_IDS,
  DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS,
  normalizeControlBarSectionVisibility,
  setControlBarSectionVisibility
} from '../../src/shared/control-bar-sections';

it('normalizes control bar section visibility and keeps one section visible', () => {
  expect(normalizeControlBarSectionVisibility(null)).toEqual(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
  expect(normalizeControlBarSectionVisibility({ quality: false })).toEqual({
    ...DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS,
    quality: false
  });
  expect(normalizeControlBarSectionVisibility(Object.fromEntries(CONTROL_BAR_SECTION_IDS.map((sectionId) => [sectionId, false])))).toEqual(
    DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS
  );
  expect(
    setControlBarSectionVisibility(
      { time: false, speed: true, volume: false, quality: false, music: false, captions: false, pin: false },
      'speed',
      false
    )
  ).toEqual({ time: false, speed: true, volume: false, quality: false, music: false, captions: false, pin: false });
});
