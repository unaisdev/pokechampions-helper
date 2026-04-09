/**
 * Game / scan slugs that are not valid `/pokemon/{name}` on PokéAPI (often merged into the base form).
 */
const POKEMON_SLUG_ALIASES: Record<string, string> = {
  // Hisui Sneasler exists in data as plain `sneasler` (single variety on species).
  'sneasler-hisui': 'sneasler',
};

/** Normalizes user or OCR input to a PokeAPI name slug (e.g. "Mr. Mime" → "mr-mime"). */
export function normalizePokemonNameQuery(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return POKEMON_SLUG_ALIASES[slug] ?? slug;
}

/** Title-case slug for UI (e.g. `palafin-zero` → "Palafin Zero"). */
export function formatPokemonSlugAsTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
