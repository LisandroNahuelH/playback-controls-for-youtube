import type { I18nKey } from '../generated/i18n-types';
import type { ControlBarSectionId } from './control-bar-section-ids';

export const CONTROL_BAR_SECTION_LABEL_KEYS: Readonly<Record<ControlBarSectionId, I18nKey>> = Object.freeze({
  time: 'controlBarSectionTime',
  speed: 'controlBarSectionSpeed',
  volume: 'controlBarSectionVolume',
  quality: 'controlBarSectionQuality',
  music: 'controlBarSectionMusic',
  captions: 'controlBarSectionCaptions',
  pin: 'controlBarSectionPin'
});
