import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const overridesDir = resolve(repoRoot, 'scripts/locale-overrides');
const localesRoot = resolve(repoRoot, 'public/_locales');
const gaps = JSON.parse(readFileSync(join(overridesDir, 'gap-translations.json'), 'utf8'));
const keepLocales = new Set(['en', 'en_AU', 'en_GB', 'en_US', ...Object.keys(gaps)]);

for (const fileName of readdirSync(overridesDir)) {
  if (!fileName.endsWith('.json') || fileName === 'gap-translations.json') continue;
  const locale = fileName.replace(/\.json$/, '');
  const gap = gaps[locale];
  if (!gap) continue;

  const overridePath = join(overridesDir, fileName);
  const current = JSON.parse(readFileSync(overridePath, 'utf8'));
  let changed = false;
  for (const [key, message] of Object.entries(gap)) {
    if (!(key in current)) {
      current[key] = message;
      changed = true;
    }
  }

  if (!changed) {
    console.log(`No gap translations needed for ${locale}`);
    continue;
  }

  writeFileSync(overridePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Merged gap translations into ${locale}`);
}

for (const locale of readdirSync(localesRoot, { withFileTypes: true })) {
  if (!locale.isDirectory() || keepLocales.has(locale.name)) continue;
  rmSync(join(localesRoot, locale.name), { recursive: true, force: true });
  console.log(`Removed untranslated locale ${locale.name}`);
}
