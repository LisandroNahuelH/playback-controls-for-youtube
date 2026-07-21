import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readCwsLocaleRegistry } from './i18n/read-cws-locale-registry.mjs';

async function main() {
  const locale = process.argv[2];
  const repoRoot = resolve(import.meta.dirname, '..');
  const registry = readCwsLocaleRegistry(repoRoot);

  if (!locale || !registry.some((entry) => entry.code === locale)) {
    throw new Error(`Unknown or missing target locale: ${locale ?? '<none>'}.`);
  }

  const runtimeDir = resolve(repoRoot, '.i18n/runtime-locales', locale);
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(
    resolve(runtimeDir, 'messages.json'),
    readFileSync(resolve(repoRoot, 'public/_locales/en/messages.json'), 'utf8')
  );
  console.log(`Bootstrapped translation workspace for ${locale}.`);
}

await main();