/** Material.checkOptions is stored as Json; this makes sure we only ever use it as string[]. */
export function parseOptions(json: unknown): string[] {
  return Array.isArray(json) ? json.filter((x): x is string => typeof x === "string") : [];
}
