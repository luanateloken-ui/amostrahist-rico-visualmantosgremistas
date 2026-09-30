export function cleanText(input?: string | null) {
  return (input ?? '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function absoluteUrl(base: string, maybeUrl?: string | null) {
  if (!maybeUrl) return null;
  try { return new URL(maybeUrl, base).toString(); } catch { return null; }
}
