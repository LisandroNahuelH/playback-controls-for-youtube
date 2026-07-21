import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const allowlist = new Set(JSON.parse(readFileSync(resolve(repoRoot, 'scripts/i18n-identical-allowlist.json'), 'utf8')).identicalMessageKeys);
const english = JSON.parse(readFileSync(resolve(repoRoot, 'public/_locales/en/messages.json'), 'utf8'));
const overridesDir = resolve(repoRoot, 'scripts/locale-overrides');

for (const fileName of readdirSync(overridesDir)) {
  if (!fileName.endsWith('.json') || fileName === 'gap-translations.json') continue;
  const locale = fileName.replace(/\.json$/, '');
  const overrides = JSON.parse(readFileSync(join(overridesDir, fileName), 'utf8'));
  const catalog = structuredClone(english);

  for (const [key, message] of Object.entries(overrides)) {
    if (!catalog[key]) {
      throw new Error(`Unknown key ${key} in override for ${locale}`);
    }
    catalog[key].message = message;
  }

  for (const key of allowlist) {
    catalog[key].message = english[key].message;
  }

  writeFileSync(resolve(repoRoot, 'public/_locales', locale, 'messages.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Applied overrides for ${locale}`);
}