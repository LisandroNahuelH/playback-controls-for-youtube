export function normalizeStringArray(value, fallback) {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string" && entry.length > 0)
    ? [...value]
    : [...fallback];
}
