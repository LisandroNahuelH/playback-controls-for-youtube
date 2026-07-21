import { expect, it } from 'vitest';
import { formatMediaVolumePercent } from '../../src/shared/format-media-volume-percent';

it('formats media volume as a visible percentage', () => {
  expect(formatMediaVolumePercent(0.55)).toBe('55%');
  expect(formatMediaVolumePercent(1.5)).toBe('150%');
  expect(formatMediaVolumePercent(2.5)).toBe('200%');
  expect(formatMediaVolumePercent(-1)).toBe('0%');
  expect(formatMediaVolumePercent(0.8, true)).toBe('0%');
});
