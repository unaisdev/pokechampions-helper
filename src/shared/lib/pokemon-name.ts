/** Normalizes user or OCR input to a PokeAPI name slug (e.g. "Mr. Mime" → "mr-mime"). */
export function normalizePokemonNameQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
