/**
 * Type icons are not returned on the `/type/{id}` JSON; they live in the PokeAPI/sprites repo.
 * @see https://github.com/PokeAPI/sprites/tree/master/sprites/types/generation-viii/sword-shield/small
 */
const TYPE_ICON_SMALL_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small';

/** Extract numeric type id from a PokéAPI type resource URL. */
export function parseTypeIdFromPokeApiUrl(url: string): number | null {
  const m = url.match(/\/type\/(\d+)\/?$/);
  if (!m) return null;
  const id = parseInt(m[1], 10);
  return Number.isFinite(id) ? id : null;
}

/** PNG URL for the small Sword/Shield style type icon (by PokéAPI type id). */
export function pokeApiTypeIconUrl(typeId: number): string {
  return `${TYPE_ICON_SMALL_BASE}/${typeId}.png`;
}
