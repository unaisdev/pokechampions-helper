/**
 * Icons for move damage category (physical / special / status), same style as Pokémon games.
 * Hosted by Pokémon Database (https://pokemondb.net) — hotlinked for convenience; swap for local assets if needed.
 */
const POKEMONDB_MOVE_CATEGORY: Record<'physical' | 'special' | 'status', string> = {
  physical: 'https://img.pokemondb.net/images/icons/move-physical.png',
  special: 'https://img.pokemondb.net/images/icons/move-special.png',
  status: 'https://img.pokemondb.net/images/icons/move-status.png',
};

export function moveDamageClassIconUrl(
  damageClass: 'physical' | 'special' | 'status',
): string {
  return POKEMONDB_MOVE_CATEGORY[damageClass];
}
