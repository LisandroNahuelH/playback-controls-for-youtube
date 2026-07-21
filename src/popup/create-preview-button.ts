import { PREVIEW_RATE_LABEL } from './preview-rate-label';

export function createPreviewButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-hidden', 'true');
  button.textContent = label;
  if (label === PREVIEW_RATE_LABEL) button.setAttribute('aria-pressed', 'true');
  return button;
}
