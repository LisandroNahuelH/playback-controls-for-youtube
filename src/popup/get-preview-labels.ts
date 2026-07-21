import { CONTROL_BAR_SECTION_LABEL_KEYS, formatMediaVolumePercent, type ControlBarSectionId } from '../shared/control-bar-sections';
import { t } from '../shared/runtime-i18n';
import { PREVIEW_RATE_LABEL } from './preview-rate-label';

export function getPreviewLabels(sectionId: ControlBarSectionId): string[] {
  if (sectionId === 'time') return [t('seekRewind15Label'), t('seekForward15Label')];
  if (sectionId === 'speed') return [t('speedDecreaseLabel'), PREVIEW_RATE_LABEL, t('speedIncreaseLabel')];
  if (sectionId === 'volume') return [t('volumeDecreaseLabel'), formatMediaVolumePercent(0.5), t('volumeIncreaseLabel')];
  if (sectionId === 'quality') return [t('qualityAutoLabel'), '1080p'];
  if (sectionId === 'captions') return [t('captionsButtonLabel')];
  return [t(CONTROL_BAR_SECTION_LABEL_KEYS[sectionId])];
}
