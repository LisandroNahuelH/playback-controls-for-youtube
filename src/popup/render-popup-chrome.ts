import { t } from '../shared/runtime-i18n';
import type { PopupContext } from './popup-context';
import { setPopupAppearance } from './set-popup-appearance';

export function renderPopupChrome(context: PopupContext): void {
  document.title = t('popupDocumentTitle');
  document.querySelector<HTMLElement>('[data-role="popup-header-title"]')!.textContent = t('popupHeaderTitle');
  document.querySelector<HTMLElement>('[data-role="popup-header-subtitle"]')!.textContent = t('popupHeaderSubtitle');
  document.querySelector<HTMLElement>('[data-role="preview-section"]')!.setAttribute('aria-label', t('previewAriaLabel'));
  document.querySelector<HTMLElement>('[data-role="themes-title"]')!.textContent = t('themesTitle');
  document.querySelector<HTMLElement>('[data-role="themes-subtitle"]')!.textContent = t('themesSubtitle');
  document.querySelector<HTMLElement>('[data-role="sections-title"]')!.textContent = t('controlBarSectionsTitle');
  document.querySelector<HTMLElement>('[data-role="sections-subtitle"]')!.textContent = t('controlBarSectionsSubtitle');
  document.querySelector<HTMLElement>('[data-role="button-guide-title"]')!.textContent = t('buttonGuideTitle');
  document.querySelector<HTMLElement>('[data-role="button-guide-subtitle"]')!.textContent = t('buttonGuideSubtitle');
  context.elements.themeList?.setAttribute('aria-label', t('availableThemesAriaLabel'));
  if (context.elements.resetButton) context.elements.resetButton.textContent = t('resetButton');
  if (context.elements.resetSectionsButton) context.elements.resetSectionsButton.textContent = t('resetSectionsButton');
  setPopupAppearance(context, context.state.appearanceId);
}
