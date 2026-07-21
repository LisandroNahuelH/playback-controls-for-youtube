import type { ControlBarSectionVisibility } from './control-bar-section-visibility';

export const DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS: ControlBarSectionVisibility = Object.freeze({
  time: true,
  speed: true,
  volume: true,
  quality: true,
  music: true,
  captions: true,
  pin: true
});
