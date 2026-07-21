import { expect, it } from 'vitest';
import { POPUP_APPEARANCE_STORAGE_KEY } from '../../src/shared/popup-appearance-preferences';
import { initPopup } from '../../src/popup/init-popup';

it('loads dark popup mode by default and persists the light mode toggle', async () => {
  const storedItems: Record<string, unknown> = {};
  document.body.innerHTML = `
    <button data-action="toggle-popup-appearance"></button>
    <div data-role="popup-header-title"></div><div data-role="popup-header-subtitle"></div>
    <section data-role="preview-section"><div data-role="preview-bar"></div></section>
    <div data-role="themes-title"></div><div data-role="themes-subtitle"></div>
    <section data-role="theme-list"></section><button data-action="reset"></button>
    <div data-role="sections-title"></div><div data-role="sections-subtitle"></div>
    <section data-role="section-toggle-list"></section><button data-action="reset-sections"></button>
    <div data-role="button-guide-title"></div><div data-role="button-guide-subtitle"></div>
    <div data-role="guide-list"></div>
  `;
  globalThis.chrome = {
    i18n: { getMessage: () => '' },
    storage: {
      local: {
        get: (defaults: Record<string, unknown>, callback: (items: Record<string, unknown>) => void) => callback({ ...defaults, ...storedItems }),
        set: (items: Record<string, unknown>, callback?: () => void) => {
          Object.assign(storedItems, items);
          callback?.();
        }
      }
    }
  } as unknown as typeof chrome;
  await initPopup();
  await Promise.resolve();
  const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-popup-appearance"]')!;
  expect(document.documentElement.dataset.popupAppearance).toBe('dark');
  expect(button.textContent).toBe('☾');
  button.click();
  await Promise.resolve();
  expect(document.documentElement.dataset.popupAppearance).toBe('light');
  expect(button.textContent).toBe('☀');
  expect(button.getAttribute('aria-label')).toBe('Switch popup to dark mode');
  expect(storedItems[POPUP_APPEARANCE_STORAGE_KEY]).toBe('light');
});
