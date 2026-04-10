/**
 * PokéAPI `Name` entries reference `language.name` (same codes as GET /api/v2/language/{name}/).
 * @see https://pokeapi.co/docs/v2#utility-section
 */
export type PokeApiNameEntry = {
  name: string;
  language: { name: string; url: string };
};

/** First matching `language.name` in `preferredOrder`, then optional slug fallback. */
export function pickLocalizedName(
  entries: PokeApiNameEntry[] | undefined,
  preferredOrder: string[],
  fallbackSlug?: string,
): string {
  const list = entries ?? [];
  for (const code of preferredOrder) {
    const hit = list.find((e) => e.language.name === code)?.name?.trim();
    if (hit) {
      return hit;
    }
  }
  if (fallbackSlug) {
    return fallbackSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return '';
}

export function pokeApiLanguagePreference(primary: string): string[] {
  const p = primary.trim().toLowerCase();
  if (!p || p === 'en') {
    return ['en'];
  }
  return [p, 'en'];
}
