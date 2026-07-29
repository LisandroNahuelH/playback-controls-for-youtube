import { sendAnonymousHeartbeat } from '../features/heartbeat/send-anonymous-heartbeat';
import { DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS } from '../shared/control-bar-sections';
import { DEFAULT_POPUP_APPEARANCE_ID } from '../shared/popup-appearance-preferences';
import { setDocumentLocaleAttributes } from '../shared/runtime-i18n';
import { DEFAULT_CONTROLS_THEME_ID } from '../shared/theme-preferences';
import { getPopupElements } from './get-popup-elements';
import type { PopupContext } from './popup-context';
import { readStoredPopupAppearance } from './read-stored-popup-appearance';
import { readStoredSectionVisibility } from './read-stored-section-visibility';
import { readStoredThemeId } from './read-stored-theme-id';
import { renderButtonGuide } from './render-button-guide';
import { renderPopupChrome } from './render-popup-chrome';
import { renderSectionOptions } from './render-section-options';
import { renderThemeOptions } from './render-theme-options';
import { resetControlsTheme } from './reset-controls-theme';
import { resetSectionsToDefault } from './reset-sections-to-default';
import { setPopupAppearance } from './set-popup-appearance';
import { setSelectedTheme } from './set-selected-theme';
import { setVisibleSections } from './set-visible-sections';
import { togglePopupAppearance } from './toggle-popup-appearance';

export async function initPopup(): Promise<void> {
  void sendAnonymousHeartbeat('ping');
  const context: PopupContext = {
    elements: getPopupElements(),
    state: {
      appearanceId: DEFAULT_POPUP_APPEARANCE_ID,
      selectedThemeId: DEFAULT_CONTROLS_THEME_ID,
      visibleSections: DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS
    }
  };
  setDocumentLocaleAttributes(document);
  renderPopupChrome(context);
  renderButtonGuide(context);
  renderThemeOptions(context);
  renderSectionOptions(context);
  context.elements.appearanceToggleButton?.addEventListener('click', togglePopupAppearance.bind(null, context));
  context.elements.resetButton?.addEventListener('click', resetControlsTheme.bind(null, context));
  context.elements.resetSectionsButton?.addEventListener('click', resetSectionsToDefault.bind(null, context));
  void readStoredPopupAppearance().then(setPopupAppearance.bind(null, context));
  void readStoredThemeId().then(setSelectedTheme.bind(null, context));
  void readStoredSectionVisibility().then(setVisibleSections.bind(null, context));
}
