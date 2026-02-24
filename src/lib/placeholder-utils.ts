/**
 * Extract unique {{key}} placeholders from text.
 * Keys are returned in order of first appearance.
 */
export function extractPlaceholderKeys(text: string): string[] {
  const re = /\{\{(\w+)\}\}/g;
  const seen = new Set<string>();
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      keys.push(m[1]);
    }
  }
  return keys;
}

/**
 * Replace all {{key}} in text with values from record. Missing keys → empty string.
 */
export function replacePlaceholders(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
}
