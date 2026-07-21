export function createGuideButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (label === '1.00x') button.setAttribute('aria-pressed', 'true');
  if (label.includes('30') || label.includes('60')) button.dataset.seekAccent = label.includes('←') ? 'rewind' : 'forward';
  return button;
}
