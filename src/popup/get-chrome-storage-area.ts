export function getChromeStorageArea(): chrome.storage.StorageArea | null {
  return globalThis.chrome?.storage?.local ?? null;
}
