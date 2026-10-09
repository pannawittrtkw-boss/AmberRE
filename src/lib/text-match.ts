// Generic fuzzy text matching — case-insensitive, whitespace-insensitive,
// substring-both-ways. Used wherever free-text fields (project names,
// addresses, etc.) need a loose match rather than exact equality.

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").trim();
}

export function textMatches(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}
