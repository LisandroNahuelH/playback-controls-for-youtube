import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_EXT_DESCRIPTION, resolveExtName } from "./manifest-store-copy.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const localesRoot = join(repoRoot, "public", "_locales");

const MAX_NAME_LENGTH = 75;
const MAX_DESCRIPTION_LENGTH = 132;

function assertLength(locale, field, value, maxLength) {
  if (value.length > maxLength) {
    throw new Error(
      `[${locale}] ${field} exceeds ${maxLength} characters (${value.length}): ${value}`
    );
  }
}

const locales = readdirSync(localesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();

let updatedLocales = 0;

for (const locale of locales) {
  const extName = resolveExtName(locale);
  const messagesPath = join(localesRoot, locale, "messages.json");
  const catalog = JSON.parse(readFileSync(messagesPath, "utf8"));

  if (!catalog.extName || !catalog.extDescription) {
    throw new Error(`[${locale}] messages.json is missing extName or extDescription.`);
  }

  const extDescription =
    locale === "en" ? CANONICAL_EXT_DESCRIPTION : catalog.extDescription.message;

  assertLength(locale, "extName", extName, MAX_NAME_LENGTH);
  assertLength(locale, "extDescription", extDescription, MAX_DESCRIPTION_LENGTH);

  const changed =
    catalog.extName.message !== extName || catalog.extDescription.message !== extDescription;

  if (!changed) {
    continue;
  }

  catalog.extName.message = extName;
  catalog.extDescription.message = extDescription;
  writeFileSync(messagesPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  updatedLocales += 1;
}

console.log(`Synced manifest store copy for ${locales.length} locale(s).`);
console.log(`Updated ${updatedLocales} locale(s).`);
