import type { PopupElements } from './popup-elements';

export function getPopupElements(): PopupElements {
  return {
    appearanceToggleButton: document.querySelector('[data-action="toggle-popup-appearance"]'),
    guideList: document.querySelector('[data-role="guide-list"]'),
    previewBar: document.querySelector('[data-role="preview-bar"]'),
    resetButton: document.querySelector('[data-action="reset"]'),
    resetSectionsButton: document.querySelector('[data-action="reset-sections"]'),
    sectionToggleList: document.querySelector('[data-role="section-toggle-list"]'),
    themeList: document.querySelector('[data-role="theme-list"]')
  };
}
