import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readCwsLocaleRegistry } from './i18n/read-cws-locale-registry.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const englishCatalog = readFileSync(resolve(repoRoot, 'public/_locales/en/messages.json'), 'utf8');
const registry = readCwsLocaleRegistry(repoRoot);

for (const entry of registry) {
  if (entry.code === 'en') {
    continue;
  }

  const localeDir = resolve(repoRoot, 'public/_locales', entry.code);
  await mkdir(localeDir, { recursive: true });
  await writeFile(resolve(localeDir, 'messages.json'), englishCatalog);
  console.log(`Bootstrapped ${entry.code}`);
}