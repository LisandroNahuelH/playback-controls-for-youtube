import { expect, it } from 'vitest';
import { adjustMediaVolume } from '../../src/shared/adjust-media-volume';

it('adjusts media volume in 10 percent steps and clamps to the safe range', () => {
  expect(adjustMediaVolume(0.5, 0.1)).toBe(0.6);
  expect(adjustMediaVolume(1, 0.1)).toBe(1.1);
  expect(adjustMediaVolume(1.95, 0.1)).toBe(2);
  expect(adjustMediaVolume(0.05, -0.1)).toBe(0);
  expect(adjustMediaVolume(1.1, -0.2)).toBe(0.9);
  expect(adjustMediaVolume(Number.NaN, -0.1)).toBe(0.9);
});
