import type { Pokemon } from 'pokenode-ts';

import type { PokemonSummary } from '@src/entities/pokemon-summary';

export function mapPokemonToSummary(pokemon: Pokemon): PokemonSummary {
  const types = [...pokemon.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);

  const stats = pokemon.stats
    .map((s) => ({
      name: s.stat.name,
      baseStat: s.base_stat,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: pokemon.id,
    name: pokemon.name,
    spriteUrl: pokemon.sprites.front_default ?? pokemon.sprites.other?.['official-artwork']?.front_default ?? null,
    types,
    stats,
    heightDm: pokemon.height,
    weightHg: pokemon.weight,
  };
}
