import type { ButtonGuideItem } from './button-guide-item';

export const BUTTON_GUIDE_ITEMS: readonly ButtonGuideItem[] = [
  { categoryKey: 'guideCategorySpeed', sampleButtons: ['-5%', '+5%'], leftClickKey: 'guideSpeedLeftClick', rightClickKey: 'guideSpeedRightClick' },
  { categoryKey: 'guideCategoryCurrentSpeed', sampleButtons: ['1.00x'], leftClickKey: 'guideCurrentSpeedLeftClick', rightClickKey: 'guideCurrentSpeedRightClick' },
  { categoryKey: 'guideCategoryVolume', sampleButtons: ['🔉 -10%', '🔊 +10%'], leftClickKey: 'guideVolumeLeftClick', rightClickKey: 'guideVolumeRightClick' },
  { categoryKey: 'guideCategoryCurrentVolume', sampleButtons: ['100%'], leftClickKey: 'guideCurrentVolumeLeftClick', rightClickKey: 'guideCurrentVolumeRightClick' },
  { categoryKey: 'guideCategoryTime', sampleButtons: ['←60s', '←30s', '←15s', '15s→', '30s→', '60s→'], leftClickKey: 'guideTimeLeftClick', rightClickKey: 'guideTimeRightClick' },
  { categoryKey: 'guideCategoryResolution', sampleButtons: ['Auto', '1080p'], leftClickKey: 'guideResolutionLeftClick', rightClickKey: 'guideResolutionRightClick' },
  { categoryKey: 'guideCategoryMusic', sampleButtons: ['♪'], leftClickKey: 'guideMusicLeftClick', rightClickKey: 'guideMusicRightClick' },
  { categoryKey: 'guideCategoryCaptions', sampleButtons: ['CC'], leftClickKey: 'guideCaptionsLeftClick', rightClickKey: 'guideCaptionsRightClick' }
];
