import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readCwsLocaleRegistry(repoRoot) {
  const registryPath = resolve(repoRoot, "docs/i18n/chrome-web-store-locales.json");
  return JSON.parse(readFileSync(registryPath, "utf8"));
}
