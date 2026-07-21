export const CONTROL_BAR_SECTION_IDS = ['time', 'speed', 'volume', 'quality', 'music', 'captions', 'pin'] as const;

export type ControlBarSectionId = (typeof CONTROL_BAR_SECTION_IDS)[number];
