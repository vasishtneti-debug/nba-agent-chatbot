const PLACEHOLDER_PATTERNS = [
  /\[[^\]]{1,80}\]/g,
  /\{\{[^}]+\}\}/g,
  /<<[^>]+>>/g,
  /\{[A-Za-z][A-Za-z0-9_\s-]{0,60}\}/g,
  /_{4,}/g,
  /_{2,3}(?=\s|$|[.,;:])/g,
];

export function detectPlaceholders(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of PLACEHOLDER_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim();
      if (value.length > 0) {
        found.add(value);
      }
    }
  }

  return [...found].sort((a, b) => b.length - a.length);
}

export function applyReplacements(text: string, replacements: Record<string, string>) {
  let result = text;

  const entries = Object.entries(replacements).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [placeholder, value] of entries) {
    if (!placeholder || !value) continue;
    result = result.split(placeholder).join(value);
  }

  return result;
}
