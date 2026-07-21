import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function findUncoveredRootHtmlEntrypoints(repoRoot, targetFiles) {
  const auditedFiles = new Set(targetFiles.map((filePath) => resolve(filePath)));

  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => resolve(repoRoot, entry.name))
    .filter((filePath) => isVisibleEntrypointHtml(filePath))
    .filter((filePath) => !auditedFiles.has(filePath))
    .map((filePath) => `${filePath.replace(`${repoRoot}\\`, "").replace(/\\/g, "/")} is not covered by the i18n literal audit.`);
}

function isVisibleEntrypointHtml(filePath) {
  const source = readFileSync(filePath, "utf8");
  return source.includes("<script") || source.includes('id="app"');
}
