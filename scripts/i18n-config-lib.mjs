import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeStringArray } from "./i18n-config/normalize-string-array.mjs";

export const DEFAULT_I18N_CONFIG = {
  includeGlobs: [
    "src/popup/**/*.{ts,tsx,js,jsx}",
    "src/shared/**/*.{ts,tsx,js,jsx}",
    "src/content/**/*.{ts,tsx,js,jsx}"
  ],
  excludeGlobs: [
    "**/dist/**",
    "**/node_modules/**",
    "**/coverage/**",
    "**/src/generated/**",
    "**/*.test.ts",
    "**/*.suite.ts",
    "**/*.d.ts",
    "src/shared/ui-font-profile-stacks.ts"
  ],
  localeDirectories: ["public/_locales"],
  scanExtensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
  i18nCallNames: ["t", "tp", "translate", "chrome.i18n.getMessage", "getI18nMessageSafe"],
  verificationCommands: ["npm run i18n:check", "npm run i18n:audit"],
  includeHtmlAttributes: ["aria-label", "title", "placeholder", "alt", "label", "value", "content"]
};

export function loadI18nConfig(repoRoot) {
  const configPath = resolve(repoRoot, "i18n_config.json");

  if (!existsSync(configPath)) {
    return structuredClone(DEFAULT_I18N_CONFIG);
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  return {
    ...DEFAULT_I18N_CONFIG,
    ...parsed,
    includeGlobs: normalizeStringArray(parsed?.includeGlobs, DEFAULT_I18N_CONFIG.includeGlobs),
    excludeGlobs: normalizeStringArray(parsed?.excludeGlobs, DEFAULT_I18N_CONFIG.excludeGlobs),
    localeDirectories: normalizeStringArray(parsed?.localeDirectories, DEFAULT_I18N_CONFIG.localeDirectories),
    scanExtensions: normalizeStringArray(parsed?.scanExtensions, DEFAULT_I18N_CONFIG.scanExtensions),
    i18nCallNames: normalizeStringArray(parsed?.i18nCallNames, DEFAULT_I18N_CONFIG.i18nCallNames),
    verificationCommands: normalizeStringArray(
      parsed?.verificationCommands,
      DEFAULT_I18N_CONFIG.verificationCommands
    ),
    includeHtmlAttributes: normalizeStringArray(
      parsed?.includeHtmlAttributes,
      DEFAULT_I18N_CONFIG.includeHtmlAttributes
    )
  };
}
